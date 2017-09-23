# -*- coding: utf-8 -*-
"""
Created on Wed Sep 20 12:56:28 2017

@author: Michael
"""

import numpy as np
import cv2
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

fontFile = u"fonts/infini/infini-gras.otf"

def testBB(file):
    # Getting the font bounding boxes
    # https://groups.google.com/forum/#!topic/fonttools/ZkDKvQzNkmA
    f = TTFont(file)
    glyphSet = f.getGlyphSet()
    
    for glyphName in ['a', 'b', 'zero', 'space']:
        pen = BoundsPen(glyphSet)
        glyphSet[glyphName].draw(pen)
        print(glyphName, pen.bounds)
        
    return pen, glyphSet


p, g = testBB(fontFile)



import freetype
face = freetype.Face("Vera.ttf")
face.set_char_size( 48*64 )
face.load_char('S')
bitmap = face.glyph.bitmap
print(bitmap.buffer)