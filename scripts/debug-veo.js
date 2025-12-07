import https from 'https';
import fs from 'fs';
import path from 'path';

// 简易 .env 解析
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
    return env;
  } catch (e) {
    return {};
  }
}

const env = loadEnv();
const API_KEY = env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ 未找到 VITE_GOOGLE_API_KEY，请确保 .env 文件存在且已配置。');
  process.exit(1);
}

const BASE_URL = 'generativelanguage.googleapis.com';
const MODEL = 'veo-3.1-generate-preview';

console.log(`🔍 开始诊断 Veo 3.1 API 连接...`);
console.log(`API Key: ${API_KEY.substring(0, 5)}...`);
console.log(`Model: ${MODEL}`);

// 1. 测试列出模型 (检查模型是否存在)
function listModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      path: `/v1beta/models?key=${API_KEY}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          const models = json.models || [];
          const veoModels = models.filter(m => m.name.includes('veo'));
          console.log('\n✅ 成功获取模型列表。可用的 Veo 模型:');
          veoModels.forEach(m => console.log(` - ${m.name}`));
          
          const targetExists = models.some(m => m.name.includes(MODEL));
          if (targetExists) {
            console.log(`\n🎉 确认模型 ${MODEL} 存在于列表中。`);
            resolve(true);
          } else {
            console.warn(`\n⚠️ 警告: 模型列表中未找到 ${MODEL}。这可能是 404 的原因。`);
            resolve(false);
          }
        } else {
          console.error(`\n❌ 获取模型列表失败: ${res.statusCode}`);
          console.error(data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`\n❌ 网络请求错误: ${e.message}`);
      resolve(false);
    });
    req.end();
  });
}

// 2. 测试 predictLongRunning 接口 (Dry Run)
function testPredictEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      instances: [{ prompt: "A cyberpunk city" }],
      parameters: { sampleCount: 1, aspectRatio: "16:9" }
    });

    const options = {
      hostname: BASE_URL,
      path: `/v1beta/models/${MODEL}:predictLongRunning?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🔍 测试 Endpoint: https://${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`HTTP 状态码: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ 接口调用成功！返回数据:');
          console.log(data.substring(0, 200) + '...');
        } else {
          console.error('❌ 接口调用失败。完整响应:');
          console.error(data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ 请求错误: ${e.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  await listModels();
  await testPredictEndpoint();
}

run();
