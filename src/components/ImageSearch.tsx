"use client";

import { useState } from "react";
import { Search, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import TopNav from "./TopNav";

interface ImageResult {
  id: string;
  thumbnail: string;
  original: string;
  sourceUrl: string;
  title: string;
}

export default function ImageSearch() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Record<string, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setHasSearched(true); setImages([]); 
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.images) setImages(data.images);
    } catch (error) {
      alert("搜索失败，请重试！");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (img: ImageResult, e: React.MouseEvent) => {
    e.stopPropagation(); setDownloadingIds((prev) => ({ ...prev, [img.id]: true }));
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(img.original)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = img.title ? img.title.replace(/[\\/:*?"<>|]/g, '').substring(0, 15) : "国风搜图";
      link.setAttribute("download", `${safeTitle}.jpg`);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("抱歉，这张图片的源站拒绝了下载请求。");
    } finally {
      setDownloadingIds((prev) => ({ ...prev, [img.id]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center py-8 px-4 font-sans transition-all">
      <TopNav />
      <div className={`w-full max-w-3xl flex flex-col items-center transition-all duration-500 ease-in-out ${hasSearched ? 'mb-8 space-y-6' : 'mt-10 space-y-10'}`}>
        <div className="flex flex-col items-center space-y-3 text-center">
          <h1 className={`${hasSearched ? 'text-4xl' : 'text-5xl'} font-extrabold tracking-tight text-stone-900 flex items-center gap-4 drop-shadow-sm transition-all`}>
            <span>🏺</span> 国风搜图
          </h1>
          {!hasSearched && <p className="text-stone-500 text-lg">全网非遗高清图库 · 一键触达东方美学</p>}
        </div>
        <form onSubmit={handleSearch} className="w-full flex gap-3 relative group">
          <Input
            type="text" placeholder="探索非遗之美，例如：清代青花瓷、川剧脸谱、非遗宫灯..."
            className="h-14 pl-6 pr-4 text-lg rounded-2xl shadow-sm border-stone-200 focus-visible:ring-stone-400 bg-white"
            value={query} onChange={(e) => setQuery(e.target.value)} disabled={loading}
          />
          <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl text-lg bg-stone-900 hover:bg-stone-800 transition-colors" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {loading ? "搜索中" : "搜 索"}
          </Button>
        </form>
      </div>

      <div className="w-full max-w-[1400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 text-stone-400"><Loader2 className="h-10 w-10 animate-spin mb-4" /><p>正在穿越历史长河为您寻图...</p></div>
        ) : images.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {images.map((img) => (
              <Card key={img.id} className="break-inside-avoid overflow-hidden group border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-xl bg-white relative">
                <CardContent className="p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumbnail} alt={img.title} loading="lazy" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4">
                    <div className="flex items-end justify-between gap-3">
                      <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md flex-1">{img.title}</p>
                      <button onClick={(e) => handleDownload(img, e)} disabled={downloadingIds[img.id]} className="shrink-0 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2.5 rounded-full transition-all disabled:opacity-50" title="下载原图">
                        {downloadingIds[img.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasSearched && !loading ? (
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 bg-stone-50/50"><p className="text-lg">未找到相关图片，请换个关键词试试</p></div>
        ) : null}
      </div>
    </main>
  );
}