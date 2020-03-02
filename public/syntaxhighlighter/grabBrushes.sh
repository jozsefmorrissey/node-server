#!/usr/bin/env bash

brushListUrl='http://alexgorbatchev.com/SyntaxHighlighter/manual/brushes/'
brushRootUrl='https://agorbatchev.typepad.com/pub/sh/3_0_83/scripts/'

brushes=$(curl "$brushListUrl" 2>/dev/null |
          grep -oP "shBrush.*\.js")

for brush in ${brushes[@]}
do
  curl "$brushRootUrl$brush" > ./brushes/$brush
  sleep 1
done
