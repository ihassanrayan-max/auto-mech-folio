import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SEOProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

export default function SEO({ title, description, canonicalPath, jsonLd }: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    if (description) setMeta("description", description);

    const canonicalUrl = `${window.location.origin}${canonicalPath ?? location.pathname}`;
    let link: HTMLLinkElement | null = document.querySelector("link[rel=canonical]");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    if (jsonLd) {
      let script = document.getElementById("ld-json") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "ld-json";
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    }
  }, [title, description, canonicalPath, jsonLd, location.pathname]);

  return null;
}
