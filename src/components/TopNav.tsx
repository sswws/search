"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, Video } from "lucide-react";

export default function TopNav() {
  const pathname = usePathname();
  
  return (
    <div className="flex bg-stone-200/60 p-1.5 rounded-full mb-8 backdrop-blur-sm shadow-sm">
      <Link href="/">
        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${pathname === '/' ? 'bg-white text-stone-900 font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
          <ImageIcon className={`w-4 h-4 ${pathname === '/' ? 'text-stone-900' : ''}`} /> 搜高清图
        </button>
      </Link>
      <Link href="/videos">
        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${pathname === '/videos' ? 'bg-white text-stone-900 font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>
          <Video className={`w-4 h-4 ${pathname === '/videos' ? 'text-red-600' : ''}`} /> 搜爆款视频
        </button>
      </Link>
    </div>
  );
}