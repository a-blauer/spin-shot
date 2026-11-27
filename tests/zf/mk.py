import json,sys
js=open('zf/scan.js').read()
for m in sys.argv[1:]:
    q=f"&map={m}&scan=1&stack=1" if not m.startswith('&') else m
    json.dump({"w":640,"h":360,"query":q,"steps":[{"js":"__sim(10);'a'"},{"wait":500},{"js":js}]},open(f'zf/m{m}.json','w'))
