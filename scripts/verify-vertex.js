
import https from 'https';

// 配置
const CONFIG = {
  projectId: process.env.PROJECT_ID,
  location: process.env.LOCATION || 'us-central1',
  token: process.env.ACCESS_TOKEN, // OAuth Token (必须)
  apiKey: process.env.API_KEY,     // 或者 API Key (如果不使用 OAuth)
};

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m"
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}=== ${msg} ===${colors.reset}`)
};

if (!CONFIG.projectId) {
  log.error("Missing PROJECT_ID environment variable.");
  process.exit(1);
}

if (!CONFIG.token && !CONFIG.apiKey) {
  log.error("Missing ACCESS_TOKEN or API_KEY environment variable.");
  process.exit(1);
}

// 简单的 fetch 封装 (Node.js 环境)
async function fetchJson(url, method, body) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (CONFIG.token) {
      headers['Authorization'] = `Bearer ${CONFIG.token}`;
    } else if (CONFIG.apiKey) {
      // Vertex API 某些端点支持通过 query param 传 key，或者 header
      // 注意: 官方 Vertex 推荐 OAuth。API Key 支持有限。
      url += (url.includes('?') ? '&' : '?') + `key=${CONFIG.apiKey}`;
    }

    const req = https.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({ status: res.statusCode, error: json });
          }
        } catch (e) {
          reject({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (e) => reject({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 测试 Gemini 文本生成
async function testGemini() {
  log.header("Testing Gemini 1.5 Flash (Text)");
  const model = "gemini-1.5-flash-001";
  const endpoint = `https://${CONFIG.location}-aiplatform.googleapis.com/v1/projects/${CONFIG.projectId}/locations/${CONFIG.location}/publishers/google/models/${model}:generateContent`;

  try {
    log.info(`Endpoint: ${endpoint}`);
    const res = await fetchJson(endpoint, 'POST', {
      contents: [{ role: 'user', parts: [{ text: 'Hello, verify yourself.' }] }],
      generationConfig: { maxOutputTokens: 10 }
    });
    const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      log.success(`Generated: "${text.trim()}"`);
      return true;
    } else {
      throw new Error("No text returned");
    }
  } catch (e) {
    log.error(`Failed: ${JSON.stringify(e.error || e)}`);
    return false;
  }
}

// 测试 Imagen 图片生成
async function testImagen() {
  log.header("Testing Imagen 3.0 (Image)");
  const model = "imagen-3.0-generate-002"; // 或 imagen-3.0-fast-generate-001
  const endpoint = `https://${CONFIG.location}-aiplatform.googleapis.com/v1/projects/${CONFIG.projectId}/locations/${CONFIG.location}/publishers/google/models/${model}:predict`;

  try {
    log.info(`Endpoint: ${endpoint}`);
    const res = await fetchJson(endpoint, 'POST', {
      instances: [{ prompt: "A blue circle" }],
      parameters: { sampleCount: 1 }
    });
    
    // Imagen 返回结构: predictions[0].bytesBase64Encoded 或类似
    const prediction = res.predictions?.[0];
    if (prediction && (prediction.bytesBase64Encoded || prediction.mimeType)) {
      log.success("Image generated successfully (base64 data received)");
      return true;
    } else {
      throw new Error("Unexpected response structure");
    }
  } catch (e) {
    // 404 通常意味着模型在这个区域不可用或名字不对
    if (e.status === 404) {
      log.warn("Model not found (404). This region might not support Imagen 3.0 yet.");
    } else {
      log.error(`Failed: ${JSON.stringify(e.error || e)}`);
    }
    return false;
  }
}

// 测试 Veo 视频生成
async function testVeo() {
  log.header("Testing Veo (Video)");
  // 尝试 Veo 3.1, 3.0 或 2.0
  const models = ["veo-3.1-generate-preview", "veo-3.0-generate-preview", "veo-2.0-generate-001"];
  
  for (const model of models) {
    log.info(`Trying model: ${model}...`);
    const endpoint = `https://${CONFIG.location}-aiplatform.googleapis.com/v1/projects/${CONFIG.projectId}/locations/${CONFIG.location}/publishers/google/models/${model}:predict`;
    
    try {
      const res = await fetchJson(endpoint, 'POST', {
        instances: [{ prompt: "A cyberpunk city, cinematic lighting" }],
        parameters: { 
          sampleCount: 1,
          durationSeconds: 5,
          aspectRatio: "16:9" 
        }
      });
      
      const prediction = res.predictions?.[0];
      if (prediction && (prediction.bytesBase64Encoded || prediction.videoUri)) {
        log.success(`Video generated successfully with ${model}!`);
        return true;
      }
    } catch (e) {
       if (e.status === 404) {
          log.warn(`${model} not found in ${CONFIG.location}.`);
       } else if (e.status === 403) {
          log.error(`Permission denied for ${model}. Check IAM roles.`);
          return false; // 权限错误通常意味着不用试下一个了
       } else {
          log.error(`Failed ${model}: ${JSON.stringify(e.error || e)}`);
       }
    }
  }
  return false;
}

async function run() {
  log.header("Vertex AI Automation Test");
  log.info(`Project: ${CONFIG.projectId}`);
  log.info(`Location: ${CONFIG.location}`);
  
  const geminiOk = await testGemini();
  const imagenOk = await testImagen();
  const veoOk = await testVeo();

  log.header("Summary");
  console.log(`Gemini (Text): ${geminiOk ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`Imagen (Image): ${imagenOk ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`Veo (Video):   ${veoOk ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
}

run().catch(console.error);
