#!/usr/bin/env bash
set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

run_timed() {
  printf '[timing]'
  printf ' %q' "$@"
  printf '\n'
  /usr/bin/time -p "$@"
}

: "${CAPTURE_URL:?Set CAPTURE_URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR}"
run_timed mkdir -p "$CAPTURE_DIR"

runtime="${HOME}/.local/share/omgithub-playwright"
if [[ ! -d "$runtime" ]]; then
  echo "Temporary capture infrastructure unavailable: Playwright runtime not found at $runtime" >&2
  exit 75
fi

run_timed env CAPTURE_URL="$CAPTURE_URL" CAPTURE_DIR="$CAPTURE_DIR" RUNTIME_PLAYWRIGHT="$runtime" node -e '
const fs=require("node:fs");
const path=require("node:path");
const runtime=process.env.RUNTIME_PLAYWRIGHT;
const createRequire=require("node:module").createRequire(path.join(runtime,"package.json"));
const {chromium}=createRequire("playwright");
(async()=>{
  let browser;
  try {
    const config=JSON.parse(fs.readFileSync(path.join(runtime,process.platform==="darwin"?"metal.json":"linux.json"),"utf8"));
    if(process.platform==="linux") process.env.DISPLAY ||= ":"+fs.readFileSync(path.join(runtime,"display"),"utf8").trim();
    browser=await chromium.launch({...config.browser.launchOptions,timeout:30000});
    for(const [name,width,height] of [["desktop",1440,900],["mobile",390,844]]){
      const page=await browser.newPage({viewport:{width,height}});
      page.setDefaultTimeout(30000);
      let navigationError;
      const response=await page.goto(process.env.CAPTURE_URL,{waitUntil:"load",timeout:45000}).catch(error=>{navigationError=error;return null});
      if(navigationError){console.error(navigationError.message);process.exitCode=75;break}
      if(!response?.ok()){
        const status=response?.status();
        console.error(`Capture navigation failed with HTTP ${status}`);
        process.exitCode=[408,429,500,502,503,504].includes(status)?75:1;
        break;
      }
      await page.locator("body").waitFor({state:"visible",timeout:30000});
      await page.waitForFunction(()=>document.fonts.status==="loaded",null,{timeout:30000}).catch(()=>{});
      await page.waitForTimeout(1000);
      await page.screenshot({path:path.join(process.env.CAPTURE_DIR,`final-${name}.png`),timeout:30000});
      await page.close();
    }
  }catch(error){
    console.error(error.message||error);
    process.exitCode=75;
  }finally{
    if(browser) await browser.close().catch(()=>{});
  }
})();
'
exit "$?"
