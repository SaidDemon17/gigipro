// js/ai/breedClassifier.js
// Clasificador de razas de perros con TensorFlow.js

let model = null;
let isModelLoading = false;
let modelLoadPromise = null;

// Inicializar el modelo MobileNet
async function initBreedClassifier() {
    if (model) return model;
    if (isModelLoading) return modelLoadPromise;
    
    isModelLoading = true;
    console.log('🔄 Cargando modelo de IA...');
    
    modelLoadPromise = mobilenet.load().then(m => {
        model = m;
        console.log('✅ Modelo de IA cargado correctamente');
        isModelLoading = false;
        return model;
    }).catch(error => {
        console.error('❌ Error cargando modelo:', error);
        isModelLoading = false;
        throw error;
    });
    
    return modelLoadPromise;
}

// Clasificar una imagen desde una URL
async function classifyImageFromUrl(imageUrl) {
    const classifier = await initBreedClassifier();
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = async () => {
            try {
                const predictions = await classifier.classify(img);
                resolve(predictions);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Error cargando imagen'));
        img.src = imageUrl;
    });
}

// Clasificar desde un elemento <img> del DOM
async function classifyImageFromElement(imgElement) {
    const classifier = await initBreedClassifier();
    return await classifier.classify(imgElement);
}

// Clasificar desde un archivo (File object)
async function classifyImageFromFile(file) {
    const url = URL.createObjectURL(file);
    try {
        const result = await classifyImageFromUrl(url);
        URL.revokeObjectURL(url);
        return result;
    } catch (error) {
        URL.revokeObjectURL(url);
        throw error;
    }
}

// Obtener solo predicciones de razas de perros
async function getDogBreedPredictions(imageUrl) {
    const predictions = await classifyImageFromUrl(imageUrl);
    
    // Palabras clave relacionadas con perros
    const dogKeywords = [
        'dog', 'puppy', 'retriever', 'shepherd', 'poodle', 'beagle',
        'labrador', 'bulldog', 'rottweiler', 'dachshund', 'husky',
        'chihuahua', 'maltese', 'shih tzu', 'pomeranian', 'corgi'
    ];
    
    const dogPredictions = predictions.filter(p => {
        const className = p.className.toLowerCase();
        return dogKeywords.some(keyword => className.includes(keyword));
    });
    
    // Si no encuentra raza específica, devolver las mejores predicciones
    if (dogPredictions.length === 0) {
        return predictions.slice(0, 3);
    }
    
    return dogPredictions.slice(0, 3);
}

// Calcular similitud visual entre dos imágenes
async function calculateVisualSimilarity(imageUrl1, imageUrl2) {
    try {
        const [predictions1, predictions2] = await Promise.all([
            getDogBreedPredictions(imageUrl1),
            getDogBreedPredictions(imageUrl2)
        ]);
        
        // Comparar predicciones
        let similarity = 0;
        let totalWeight = 0;
        
        for (const pred1 of predictions1) {
            for (const pred2 of predictions2) {
                const matchScore = calculateKeywordSimilarity(pred1.className, pred2.className);
                const weight = Math.min(pred1.probability, pred2.probability);
                similarity += matchScore * weight;
                totalWeight += weight;
            }
        }
        
        return totalWeight > 0 ? Math.round((similarity / totalWeight) * 100) : 0;
    } catch (error) {
        console.error('Error calculando similitud visual:', error);
        return 0;
    }
}

// Calcular similitud entre dos textos de razas
function calculateKeywordSimilarity(text1, text2) {
    const keywords1 = text1.toLowerCase().split(' ');
    const keywords2 = text2.toLowerCase().split(' ');
    
    let matches = 0;
    for (const k1 of keywords1) {
        if (keywords2.some(k2 => k2.includes(k1) || k1.includes(k2))) {
            matches++;
        }
    }
    
    return matches / Math.max(keywords1.length, keywords2.length);
}

// Sugerir raza basada en múltiples fotos
async function suggestBreedFromMultiplePhotos(photoUrls) {
    if (!photoUrls || photoUrls.length === 0) return null;
    
    const allPredictions = [];
    
    for (const url of photoUrls) {
        try {
            const predictions = await getDogBreedPredictions(url);
            allPredictions.push(...predictions);
        } catch (error) {
            console.error('Error clasificando:', error);
        }
    }
    
    // Agrupar y contar predicciones
    const breedCount = {};
    for (const pred of allPredictions) {
        const breed = pred.className.split(',')[0];
        if (!breedCount[breed]) {
            breedCount[breed] = { count: 0, totalProb: 0 };
        }
        breedCount[breed].count++;
        breedCount[breed].totalProb += pred.probability;
    }
    
    // Encontrar la raza más común
    let bestBreed = null;
    let bestScore = 0;
    
    for (const [breed, data] of Object.entries(breedCount)) {
        const score = (data.count / allPredictions.length) * (data.totalProb / data.count);
        if (score > bestScore) {
            bestScore = score;
            bestBreed = breed;
        }
    }
    
    return bestBreed;
}

// Exportar funciones
window.initBreedClassifier = initBreedClassifier;
window.classifyImageFromUrl = classifyImageFromUrl;
window.classifyImageFromFile = classifyImageFromFile;
window.getDogBreedPredictions = getDogBreedPredictions;
window.calculateVisualSimilarity = calculateVisualSimilarity;
window.suggestBreedFromMultiplePhotos = suggestBreedFromMultiplePhotos;