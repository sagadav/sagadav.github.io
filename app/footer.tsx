import Script from 'next/script'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-6 font-[family-name:var(--font-geist-mono)] text-xs text-zinc-500">
      <div className="flex items-center justify-between">
        <a
          href="https://github.com/sagadav"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-orange-400"
        >
          © {new Date().getFullYear()} sagadav
        </a>
        <span aria-hidden="true">· • ● • ·</span>
      </div>
      <Script strategy="afterInteractive" id="yandex-metrika">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(100384418, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src="https://mc.yandex.ru/watch/100384418"
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </footer>
  )
}
