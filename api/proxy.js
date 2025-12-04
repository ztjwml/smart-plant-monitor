// /api/proxy.js
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, deviceId = 'arduino_001', ...data } = req.body;
  
  // 你的微信云配置 - 这些敏感信息在服务器端，安全！
  const APPID = 'wx3bb0d4ed9cad0c5c';
  const SECRET = 'd344fce7fb62465cc9ccd30458396d6d';
  const ENV_ID = 'ztj-9g36574we7f9c18c';
  const FUNCTION_NAME = 'device';

  try {
    // 1. 获取access_token
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
    );
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      return res.status(500).json({ error: '获取token失败', details: tokenData });
    }

    // 2. 调用云函数
    const cloudRes = await fetch(
      `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${tokenData.access_token}&env=${ENV_ID}&name=${FUNCTION_NAME}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, deviceId, ...data })
      }
    );
    
    const cloudData = await cloudRes.json();
    
    // 解析resp_data
    if (cloudData.errcode === 0 && cloudData.resp_data) {
      const result = JSON.parse(cloudData.resp_data);
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: '云函数调用失败', details: cloudData });
    }
  } catch (error) {
    console.error('代理服务器错误:', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
}
