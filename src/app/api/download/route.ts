import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('缺少图片链接', { status: 400 });
  }

  try {
    // 后端服务器去请求原图（服务器之间没有浏览器的跨域限制）
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`获取图片失败: ${response.status}`);
    }

    // 将图片转换为 Buffer 流
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 设置响应头，强制浏览器作为附件下载
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Content-Disposition', 'attachment; filename="guofeng-image.jpg"');

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('中转下载失败:', error);
    return new NextResponse('下载失败，原图可能已失效', { status: 500 });
  }
}