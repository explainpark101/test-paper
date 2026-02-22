export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  const key = url.pathname.slice(1);
  
	  // CORS 헤더 설정
	  const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Authorization, Content-Type",
	  };
  
	  // Preflight 요청 처리
	  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
	  // 1. 토큰 검증 (Authorization 헤더 확인)
	  const authHeader = request.headers.get("Authorization");
	  // env.MASTER_TOKEN은 Cloudflare Dashboard -> Settings -> Variables -> Secrets에 저장한 값
	  if (!authHeader || authHeader !== `Bearer ${env.MASTER_TOKEN}`) {
		return new Response("Unauthorized", { status: 401, headers: corsHeaders });
	  }
  
	  try {
		if (request.method === "PUT") {
		  const val = await request.text();
		  await env.KV.put(key, val);
		  return new Response("Success", { headers: corsHeaders });
		}
  
		if (request.method === "GET") {
		  const value = await env.KV.get(key);
		  return new Response(value, { headers: corsHeaders });
		}
  
		if (request.method === "DELETE") {
		  await env.KV.delete(key);
		  return new Response("Deleted", { headers: corsHeaders });
		}
	  } catch (err) {
		return new Response(err.message, { status: 500, headers: corsHeaders });
	  }
  
	  return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
	}
  }