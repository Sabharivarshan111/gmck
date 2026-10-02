import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  image?: string;
}

export const SEOHead = ({ title, description, keywords, canonical, image }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const updateNamedMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const updatePropertyMeta = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateNamedMeta("description", description);
    updateNamedMeta("robots", "index,follow,max-image-preview:large");

    // Kept for backwards compatibility with existing pages that still pass keywords.
    if (keywords) updateNamedMeta("keywords", keywords);

    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonical);
    }

    const resolvedImage = image ?? "https://mbbsqbank-questor.lovable.app/og-image.png";

    updatePropertyMeta("og:title", title);
    updatePropertyMeta("og:description", description);
    updatePropertyMeta("og:type", "website");
    updatePropertyMeta("og:site_name", "ORBIT MBBS QBANK");
    if (canonical) updatePropertyMeta("og:url", canonical);
    updatePropertyMeta("og:image", resolvedImage);

    updateNamedMeta("twitter:card", "summary_large_image");
    updateNamedMeta("twitter:title", title);
    updateNamedMeta("twitter:description", description);
    updateNamedMeta("twitter:image", resolvedImage);
  }, [title, description, keywords, canonical, image]);

  return null;
};
