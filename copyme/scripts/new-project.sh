#!/usr/bin/env bash
# bash new-project.sh <dest>   e.g. bash new-project.sh ~/Downloads/site/rebuild
# Ready Next 15 + Tailwind v4 + lucide-react + gsap project in seconds: a cached base is built once
# (~/.cache/copyme/base, rebuilt when older than 30 days) and cloned with APFS copy-on-write (cp -c).
# Then copy only the templates this site needs from <skill>/templates (they are references, adapt them).
set -e
dest=${1:?usage: bash new-project.sh <dest>}
base=~/.cache/copyme/base
if [[ ! -d $base/node_modules || -n $(find $base -maxdepth 0 -mtime +30) ]]; then
  rm -rf $base && mkdir -p ~/.cache/copyme && cd ~/.cache/copyme
  npx -y create-next-app@15 base --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --no-turbopack --yes >/dev/null
  cd base && npm i lucide-react gsap >/dev/null
  rm -rf public/*.svg app/favicon.ico
fi
[[ -e $dest ]] && { echo "exists: $dest"; exit 1; }
cp -cR $base $dest 2>/dev/null || cp -R $base $dest
cd $dest && node -e 'const f="package.json",p=require("./"+f);p.name=require("path").basename(process.cwd()).toLowerCase().replace(/[^a-z0-9-]/g,"-")||"rebuild";require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
echo "ready: $dest ($(du -sh . | cut -f1))"
