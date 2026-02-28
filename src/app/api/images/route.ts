import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: '关键词不能为空' }, { status: 400 });
  }

  // 读取 SerpApi 的 Key
  const apiKey = process.env.SERPAPI_KEY || '';
  console.log(`[API调用] 关键词: ${q}, API Key 前四位: ${apiKey.substring(0,4)}`);

  try {
    // 调用 SerpApi 的 Google Images 接口 (注意 URL 和参数变了)
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q)}&gl=cn&hl=zh-cn&api_key=${apiKey}`;
    const response = await fetch(url);

    const data = await response.json();

    if (data.error) {
      console.error('[SerpApi 报错]:', data.error);
      return NextResponse.json({ error: data.error }, { status: 401 });
    }

    // 解析 SerpApi 的专属返回格式 (字段名是 images_results)
    const images = data.images_results?.map((img: any, index: number) => ({
      id: `${img.position}-${index}`,
      thumbnail: img.thumbnail, // 缩略图
      original: img.original,   // 原图
      sourceUrl: img.link,      // 来源网站
      title: img.title,
      width: img.original_width,
      height: img.original_height
    })) || [];

    console.log(`[成功] 找到了 ${images.length} 张图片`);
    return NextResponse.json({ images });

  } catch (error) {
    console.error('[代码执行报错]:', error);
    return NextResponse.json({ error: '图片搜索服务暂时不可用' }, { status: 500 });
  }
}