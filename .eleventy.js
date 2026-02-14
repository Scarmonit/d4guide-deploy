module.exports = function(eleventyConfig) {
  // Add startsWith filter for dynamic navigation active states
  eleventyConfig.addFilter("startsWith", function(str, prefix) {
    if (typeof str !== 'string') return false;
    return str.startsWith(prefix);
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  // Copy game static assets (but NOT index.njk - let Eleventy process that)
  eleventyConfig.addPassthroughCopy("src/game/assets");
  eleventyConfig.addPassthroughCopy("src/game/css");
  eleventyConfig.addPassthroughCopy("src/game/js");

  eleventyConfig.addPassthroughCopy("src/kpass/css");
  eleventyConfig.addPassthroughCopy("src/kpass/scripts");
  eleventyConfig.addPassthroughCopy("src/changepassword/css");
  eleventyConfig.addPassthroughCopy("src/changepassword/scripts");
  eleventyConfig.addPassthroughCopy({ "src/music/music.css": "music/music.css" });
  eleventyConfig.addPassthroughCopy("src/music/songs");
  eleventyConfig.addPassthroughCopy("src/music/covers");

  eleventyConfig.addPassthroughCopy({ "src/ai/ai.css": "ai/ai.css" });
  eleventyConfig.addPassthroughCopy({ "src/ai/ai.js": "ai/ai.js" });
  eleventyConfig.addPassthroughCopy({ "src/_routes.json": "_routes.json" });
  eleventyConfig.addPassthroughCopy({ "src/manifest.json": "manifest.json" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Date filter for sitemap
  eleventyConfig.addFilter("dateFormat", function(dateObj) {
    if (!dateObj) return '';
    return new Date(dateObj).toISOString().split('T')[0];
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
};