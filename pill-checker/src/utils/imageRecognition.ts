import * as tf from "@tensorflow/tfjs";

// 画像をリサイズしてテンソルに変換
const preprocessImage = async (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  size: number = 224,
): Promise<tf.Tensor3D> => {
  return tf.tidy(() => {
    let tensor = tf.browser.fromPixels(imageElement);
    // リサイズ
    const resized = tf.image.resizeBilinear(tensor, [size, size]);
    // 正規化 [0, 255] -> [0, 1]
    const normalized = resized.div(255.0);
    return normalized as tf.Tensor3D;
  });
};

// 画像の特徴ベクトルを抽出（簡易版：平均RGB値とテクスチャ特徴）
export const extractImageFeatures = async (
  imageData: string, // Base64 data URL
): Promise<Float32Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        await tf.ready();
        const tensor = await preprocessImage(img, 224);
        
        // 簡易特徴抽出：RGB平均値、分散、ヒストグラム特徴
        const features = tf.tidy(() => {
          // RGB平均
          const mean = tensor.mean([0, 1]);
          // RGB標準偏差
          const meanExpanded = tensor.mean([0, 1], true);
          const std = tensor.sub(meanExpanded).square().mean([0, 1]).sqrt();
          
          // グレースケール化してヒストグラム特徴を取得
          const gray = tensor.mean(2);
          const histBins = 8;
          const histFeatures: tf.Tensor[] = [];
          for (let i = 0; i < histBins; i++) {
            const threshold = i / histBins;
            const bin = gray.greater(threshold).cast("float32").mean([0, 1]);
            histFeatures.push(bin);
          }
          
          // 特徴を結合
          const hist = tf.concat(histFeatures, 0);
          const combined = tf.concat([mean, std, hist], 0);
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
  threshold: number = 0.7, // 類似度の閾値
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
      
      if (maxSimilarity >= threshold) {
        // 類似度に基づいて個数を推定（簡易版：類似度が高いほど多く検出）
        const estimatedCount = Math.max(
          1,
          Math.round(maxSimilarity * 3), // 最大3個まで
        );
        
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

// カメラのビデオストリームからフレームをキャプチャ
export const captureFrame = (video: HTMLVideoElement): string => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");
  
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.8);
};

