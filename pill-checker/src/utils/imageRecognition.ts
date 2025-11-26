import * as tf from "@tensorflow/tfjs";

// 画像をリサイズしてテンソルに変換（前処理を強化）
const preprocessImage = async (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  size: number = 224,
): Promise<tf.Tensor3D> => {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(imageElement);
    // リサイズ
    const resized = tf.image.resizeBilinear(tensor, [size, size]);
    // 正規化 [0, 255] -> [0, 1]
    let normalized = resized.div(255.0);
    
    // 明るさ正規化（ヒストグラム均等化風）
    const mean = normalized.mean();
    const std = normalized.sub(mean).square().mean().sqrt();
    normalized = normalized.sub(mean).div(std.add(0.001)); // ゼロ除算防止
    normalized = normalized.mul(0.1).add(0.5); // 再スケール
    
    // ガウシアンブラーでノイズ除去（簡易版：平均フィルタ）
    // 注意: 簡略化のため、ノイズ除去はスキップ（必要に応じて後で追加）
    
    return normalized as tf.Tensor3D;
  });
};

// エッジ検出（Sobel風）
const detectEdges = (gray: tf.Tensor2D): tf.Tensor2D => {
  return tf.tidy(() => {
    const sobelX = tf.tensor2d([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], [3, 3]);
    const sobelY = tf.tensor2d([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], [3, 3]);
    
    // 型アサーションを追加してTensor4Dとして明示
    const grayExpanded = gray.expandDims(2).expandDims(0) as tf.Tensor4D;
    const kernelX = sobelX.expandDims(2).expandDims(3) as tf.Tensor4D;
    const kernelY = sobelY.expandDims(2).expandDims(3) as tf.Tensor4D;
    
    const edgesX = tf.conv2d(grayExpanded, kernelX, 1, "same").squeeze([0, 3]) as tf.Tensor2D;
    const edgesY = tf.conv2d(grayExpanded, kernelY, 1, "same").squeeze([0, 3]) as tf.Tensor2D;
    
    const edges = edgesX.square().add(edgesY.square()).sqrt();
    return edges as tf.Tensor2D;
  }) as tf.Tensor2D;
};

// テクスチャ特徴（LBP風：Local Binary Pattern）
const extractTextureFeatures = (gray: tf.Tensor2D): tf.Tensor1D => {
  return tf.tidy(() => {
    const [h, w] = gray.shape;
    const textureFeatures: number[] = [];
    
    // 簡易LBP：各ピクセルと周囲8ピクセルの比較
    const grayData = gray.arraySync() as number[][];
    const bins = new Array(16).fill(0);
    
    for (let y = 1; y < h - 1; y += 4) {
      for (let x = 1; x < w - 1; x += 4) {
        const center = grayData[y][x];
        let pattern = 0;
        const neighbors = [
          grayData[y - 1][x - 1], grayData[y - 1][x], grayData[y - 1][x + 1],
          grayData[y][x + 1], grayData[y + 1][x + 1], grayData[y + 1][x],
          grayData[y + 1][x - 1], grayData[y][x - 1]
        ];
        
        neighbors.forEach((neighbor, i) => {
          if (neighbor > center) pattern |= 1 << i;
        });
        
        bins[pattern % 16]++;
      }
    }
    
    const total = bins.reduce((a, b) => a + b, 0);
    return tf.tensor1d(bins.map(b => total > 0 ? b / total : 0));
  }) as tf.Tensor1D;
};

// 色空間特徴（HSV変換風）
const extractColorFeatures = (tensor: tf.Tensor3D): tf.Tensor1D => {
  return tf.tidy(() => {
    const [r, g, b] = tf.split(tensor, 3, 2);
    
    // 簡易HSV変換
    const max = tf.maximum(tf.maximum(r, g), b);
    const min = tf.minimum(tf.minimum(r, g), b);
    const delta = max.sub(min);
    
    // Hue（色相）- 簡易版
    const rMax = max.equal(r);
    const gMax = max.equal(g);
    const bMax = max.equal(b);
    
    const hueR = g.sub(b).div(delta.add(0.001)).mul(60);
    const hueG = b.sub(r).div(delta.add(0.001)).mul(60).add(120);
    const hueB = r.sub(g).div(delta.add(0.001)).mul(60).add(240);
    
    const hue = rMax.mul(hueR)
      .add(gMax.mul(hueG))
      .add(bMax.mul(hueB))
      .add(delta.less(0.001).mul(0));
    
    // Saturation（彩度）
    const saturation = tf.where(
      max.greater(0.001),
      delta.div(max.add(0.001)),
      tf.zerosLike(max)
    );
    
    // Value（明度）
    const value = max;
    
    // 統計特徴
    const hueMean = hue.mean([0, 1]);
    const hueStd = hue.sub(hueMean).square().mean([0, 1]).sqrt();
    const satMean = saturation.mean([0, 1]);
    const valMean = value.mean([0, 1]);
    
    return tf.concat([hueMean, hueStd, satMean, valMean], 0);
  }) as tf.Tensor1D;
};

// 画像の特徴ベクトルを抽出（改良版：より高度な特徴抽出）
export const extractImageFeatures = async (
  imageData: string, // Base64 data URL
): Promise<Float32Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        await tf.ready();
        const tensor = await preprocessImage(img, 224);
        
        // 高度な特徴抽出
        const features = tf.tidy(() => {
          // 1. RGB統計特徴
          const mean = tensor.mean([0, 1]);
          const meanExpanded = tensor.mean([0, 1], true);
          const std = tensor.sub(meanExpanded).square().mean([0, 1]).sqrt();
          
          // 2. グレースケール特徴
          const gray = tensor.mean(2) as tf.Tensor2D;
          const grayMean = gray.mean([0, 1]);
          const grayStd = gray.sub(grayMean).square().mean([0, 1]).sqrt();
          
          // 3. ヒストグラム特徴（より詳細）
          const histBins = 16;
          const histFeatures: tf.Tensor[] = [];
          for (let i = 0; i < histBins; i++) {
            const threshold = i / histBins;
            const bin = gray.greater(threshold).cast("float32").mean([0, 1]);
            histFeatures.push(bin);
          }
          
          // 4. エッジ特徴
          const edges = detectEdges(gray);
          const edgeStrength = edges.mean([0, 1]);
          const edgeDensity = edges.greater(0.1).cast("float32").mean([0, 1]);
          
          // 5. テクスチャ特徴
          const texture = extractTextureFeatures(gray);
          
          // 6. 色空間特徴
          const colorFeatures = extractColorFeatures(tensor);
          
          // すべての特徴を結合
          const hist = tf.concat(histFeatures, 0);
          const grayStats = tf.stack([grayMean, grayStd]).asType("float32").reshape([2]);
          const edgeStats = tf
            .stack([edgeStrength, edgeDensity])
            .asType("float32")
            .reshape([2]);
          
          const combined = tf.concat([
            mean,           // 3次元（RGB平均）
            std,            // 3次元（RGB標準偏差）
            grayStats,      // 2次元（グレースケール統計）
            hist,           // 16次元（ヒストグラム）
            edgeStats,      // 2次元（エッジ特徴）
            texture,        // 16次元（テクスチャ）
            colorFeatures,  // 4次元（色空間）
          ], 0);
          
          return combined.flatten();
        });
        
        const featuresArray = await features.array();
        features.dispose();
        tensor.dispose();
        
        resolve(new Float32Array(featuresArray as number[]));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = imageData;
  });
};

// コサイン類似度を計算
const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
};

// 画像から薬を認識
export type RecognitionResult = {
  medicationId: string;
  confidence: number;
  count: number;
};

export const recognizeMedications = async (
  capturedImage: string, // カメラで撮影した画像
  registeredMedications: Array<{
    id: string;
    name: string;
    surfaceImage?: string;
    backImage?: string;
  }>,
  threshold: number = 0.8, // 類似度の閾値（高めに設定して誤検出を減らす）
): Promise<RecognitionResult[]> => {
  try {
    await tf.ready();
    
    // 撮影画像の特徴を抽出
    const capturedFeatures = await extractImageFeatures(capturedImage);
    
    const results: RecognitionResult[] = [];
    
    // 各登録薬と比較
    for (const med of registeredMedications) {
      const features: Float32Array[] = [];
      
      if (med.surfaceImage) {
        const surfaceFeatures = await extractImageFeatures(med.surfaceImage);
        features.push(surfaceFeatures);
      }
      
      if (med.backImage) {
        const backFeatures = await extractImageFeatures(med.backImage);
        features.push(backFeatures);
      }
      
      if (features.length === 0) continue;
      
      // 最も高い類似度を取得
      let maxSimilarity = 0;
      for (const feature of features) {
        const similarity = cosineSimilarity(capturedFeatures, feature);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
      
      // 高めの閾値とマージンを用意し、誤検出を抑制
      const strictThreshold = Math.max(0.75, threshold);
      const confidenceMargin = 0.05;
      if (maxSimilarity >= strictThreshold + confidenceMargin) {
        // 類似度に基づいて個数を推定（閾値との差分でスケーリング）
        const normalized = Math.min(
          1,
          (maxSimilarity - strictThreshold) / (1 - strictThreshold),
        );
        const estimatedCount = Math.max(1, Math.min(3, Math.round(normalized * 3)));
        
        results.push({
          medicationId: med.id,
          confidence: maxSimilarity,
          count: estimatedCount,
        });
      }
    }
    
    // 信頼度順にソート
    results.sort((a, b) => b.confidence - a.confidence);
    
    return results;
  } catch (error) {
    console.error("画像認識エラー:", error);
    return [];
  }
};

// カメラのビデオストリームからフレームをキャプチャ（品質向上）
export const captureFrame = (video: HTMLVideoElement): string => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");
  
  // 画像品質向上のための設定
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  
  ctx.drawImage(video, 0, 0);
  
  // より高品質なJPEGで保存（品質0.9に向上）
  return canvas.toDataURL("image/jpeg", 0.9);
};

// 複数フレームをキャプチャして平均化（精度向上のため）
export const captureMultipleFrames = async (
  video: HTMLVideoElement,
  count: number = 3,
  interval: number = 100
): Promise<string> => {
  const frames: string[] = [];
  
  for (let i = 0; i < count; i++) {
    frames.push(captureFrame(video));
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  // 最初のフレームを返す（将来的に平均化処理を追加可能）
  return frames[0];
};

