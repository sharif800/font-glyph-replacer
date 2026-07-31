
import fontforge, sys
f = fontforge.font()
g = f.createChar(65, "A")
# Draw a triangle for A
pen = g.glyphPen()
pen.moveTo((100, 0))
pen.lineTo((300, 700))
pen.lineTo((500, 0))
pen.closePath()
pen = None

g.export("test_a.svg")
with open("test_a.svg") as fp:
    print(fp.read())
