from pathlib import Path
from random import Random
from math import cos, sin, tau
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W,H=540,960
OUT=Path(__file__).parent
FONTS=OUT.parent/"bat-rice-shadow-puppet"/"fonts"
rng=Random(7)
black="#211c28"

def canvas(top,bottom):
    im=Image.new("RGB",(W,H))
    a,b=[tuple(bytes.fromhex(c[1:])) for c in (top,bottom)]
    d=ImageDraw.Draw(im)
    for y in range(H):
        d.line((0,y,W,y),fill=tuple(round(x+(z-x)*y/H) for x,z in zip(a,b)))
    return im,d

def caption(d,n,title,sub,light):
    fg="#fef0d8" if light else "#221f30"
    def font(size,bold=False):
        return ImageFont.truetype(str(FONTS/("Kanit-SemiBold.ttf" if bold else "Kanit-Regular.ttf")),size)
    d.text((34,35),"ANT BROKE    /    "+n,font=font(16,True),fill=fg)
    d.line((34,66,506,66),fill=fg,width=1)
    d.text((32,830),title,font=font(54,True),fill=fg)
    d.text((36,901),sub,font=font(19),fill=fg)

def orb(d,x,y,rx,ry,dark,bright):
    a,b=[tuple(bytes.fromhex(c[1:])) for c in (dark,bright)]
    for i in range(34):
        t=i/34
        cx,cy=x-rx*.32*t,y-ry*.40*t
        r,s=rx*(1-t*.93),ry*(1-t*.93)
        d.ellipse((cx-r,cy-s,cx+r,cy+s),fill=tuple(round(k+(j-k)*t**.58) for k,j in zip(a,b)))

def ant(d,x,y,s,mode,left=None,right=None):
    def pt(a,b):return x+a*s,y+b*s
    def line(points,color,width):
        d.line([pt(a,b) for a,b in points],fill=color,width=max(1,round(width*s)),joint="curve")
    ink={"clay":"#712336","comic":black,"winter":"#3c2732"}[mode]
    for sign in (-1,1):
        for i,(a,b) in enumerate([(73,43),(91,77),(77,109)]):
            line([(sign*15,32+i*18),(sign*(a-20),b-14),(sign*a,b)],ink,9)
    for a,b,r,h in [(0,79,34,33),(0,39,23,27),(0,0,48,43)]:
        if mode=="clay":
            orb(d,*pt(a,b),r*s,h*s,"#80233a","#ff9171")
        else:
            xx,yy=pt(a,b)
            d.ellipse((xx-r*s,yy-h*s,xx+r*s,yy+h*s),fill="#ad5250" if mode=="winter" else "#f44543",outline=ink,width=max(1,round(4*s)))
    for sign,end in [(-1,left),(1,right)]:
        p=[pt(sign*20,-30),pt(sign*34,-63),end or pt(sign*58,-76)]
        d.line(p,fill=ink,width=max(2,round(6*s)),joint="curve")
        xx,yy=p[-1]
        r=5*s
        d.ellipse((xx-r,yy-r,xx+r,yy+r),fill="#ffb275" if mode=="clay" else ink)
    for a in (-17,17):
        xx,yy=pt(a,-4)
        d.ellipse((xx-11*s,yy-13*s,xx+11*s,yy+13*s),fill="#fff4d8")
        d.ellipse((xx-3*s,yy-4*s,xx+6*s,yy+7*s),fill=black)
    d.arc((*pt(-10,8),*pt(13,26)),0 if mode!="winter" else 190,175 if mode!="winter" else 350,ink,max(1,round(3*s)))

def phone(im,x,y,angle,tint):
    p=Image.new("RGBA",(150,252))
    d=ImageDraw.Draw(p)
    d.rounded_rectangle((5,1,145,251),radius=22,fill="#1d273e")
    d.rounded_rectangle((12,8,138,235),radius=17,fill=tint)
    d.rounded_rectangle((53,9,98,19),radius=5,fill="#1d273e")
    for row in range(2):
        for col in range(2):
            l,t=22+col*54,40+row*61
            d.rounded_rectangle((l,t,l+49,t+54),radius=7,fill="#fff0d6")
            d.rounded_rectangle((l+12,t+17,l+37,t+40),radius=5,fill=("#e88659","#e34f75","#af79d9","#eaa753")[row*2+col])
            d.arc((l+18,t+8,l+32,t+26),180,360,fill="#5d3a64",width=2)
    d.rounded_rectangle((25,174,126,212),radius=18,fill="#f65a66")
    d.line([(64,194),(73,201),(87,184)],fill="white",width=5)
    p=p.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True)
    im.paste(p,(x-p.width//2,y-p.height//2),p)

def clay():
    im,d=canvas("#57cbbb","#23637a")
    for _ in range(54):
        x,y=rng.randrange(W),rng.randrange(140,735)
        r=rng.randrange(2,9)
        d.ellipse((x-r,y-r,x+r,y+r),fill=rng.choice(["#6bd0ac","#50ac9c","#7edabd"]))
    d.ellipse((-52,245,592,830),fill="#288d86")
    d.ellipse((-30,220,570,802),fill="#85d8a6")
    d.ellipse((23,275,518,769),fill="#73c697")
    shadow=Image.new("RGBA",im.size)
    ImageDraw.Draw(shadow).ellipse((65,593,479,742),fill=(30,49,75,130))
    im.paste(layer:=shadow.filter(ImageFilter.GaussianBlur(24)),(0,0),layer)
    phone(im,134,460,22,"#ffbd6e")
    phone(im,406,460,-22,"#80e6ef")
    ant(d,269,569,1.50,"clay",(156,522),(389,522))
    for x in (156,389):
        d.ellipse((x-13,509,x+13,535),outline="#fff6bd",width=2)
    for x,y in [(95,694),(123,711),(418,701),(442,672)]:
        orb(d,x,y,8,6,"#3c9d80","#adf0ac")
    caption(d,"08","CLAY CHECKOUT","หนวดสองข้าง กดสั่งพร้อมกัน",True)
    return im

def poly(d,pts,col,edge=black,width=4):
    d.polygon(pts,fill=col)
    d.line(pts+[pts[0]],fill=edge,width=width,joint="curve")

def comic():
    im,d=canvas("#fff2ce","#fff2ce")
    for i in range(32):
        a=tau*i/32
        p=(271+670*cos(a),498+670*sin(a))
        q=(271+283*cos(a+.035),498+223*sin(a+.035))
        r=(271+650*cos(a+.019),498+650*sin(a+.019))
        if q[1]>125:d.polygon((p,q,r),fill="#e44c42")
    d.polygon([(0,740),(540,617),(540,812),(0,812)],fill="#f2cd83")
    for y in range(660,810,10):
        for x in range(y%20//2,540,10):
            if y>740-x*.23:d.ellipse((x,y,x+3,y+3),fill="#6b4f54")
    d.ellipse((10,515,314,716),fill="#bb794f",outline=black,width=7)
    d.rounded_rectangle((130,565,202,685),radius=41,fill=black)
    poly(d,[(154,283),(249,186),(495,223),(437,322)],"#ffe0a5",width=8)
    poly(d,[(437,322),(495,223),(510,603),(446,709)],"#c77a4e",width=8)
    poly(d,[(154,283),(437,322),(446,709),(143,651)],"#f6bc76",width=9)
    for y in range(342,685,10):
        for x in range(163+y%20//2,436,10):
            if y>300+.14*(x-150) and y<640+.19*(x-150):
                d.ellipse((x,y,x+2+(x>346),y+2+(x>346)),fill="#a86d55")
    poly(d,[(291,307),(348,315),(350,453),(326,442),(314,454),(291,437)],"#ee463e",width=3)
    poly(d,[(291,307),(348,315),(421,213),(374,205)],"#ee463e",width=3)
    d.rounded_rectangle((182,479,269,555),radius=6,fill="#fff3d1",outline=black,width=4)
    for x in range(193,259,6):
        d.line((x,496,x,538),fill=black,width=1+x%3)
    ant(d,105,685,.51,"comic",right=(142,650))
    ant(d,231,756,.33,"comic")
    ant(d,349,740,.39,"comic")
    d.rectangle((0,813,540,960),fill="#fff2ce")
    caption(d,"11","PARCEL PANIC","พัสดุมาถึงแล้ว แต่เข้ารังไม่ได้",False)
    return im

def box(d,x,y,w,h,open_top=False):
    poly(d,[(x,y),(x+w,y+7),(x+w,y+h),(x,y+h-3)],"#936556","#2b3444",2)
    poly(d,[(x+w,y+7),(x+w+17,y-9),(x+w+17,y+h-11),(x+w,y+h)],"#674b4c","#2b3444",2)
    poly(d,[(x,y),(x+16,y-15),(x+w+17,y-9),(x+w,y+7)],"#392f39" if open_top else "#b88763","#2b3444",2)
    if open_top:
        poly(d,[(x,y),(x-11,y-21),(x+w-8,y-18),(x+w,y+7)],"#aa795e","#2b3444",2)
        poly(d,[(x+16,y-15),(x+24,y-32),(x+w+24,y-27),(x+w+17,y-9)],"#75524a","#2b3444",2)
    d.rectangle((x+6,y+h-16,x+21,y+h-10),fill="#bda28b")

def winter():
    im,d=canvas("#183147","#131d2b")
    d.ellipse((368,105,439,176),fill="#d4e9e9")
    for _ in range(165):
        x,y=rng.randrange(W),rng.randrange(89,345)
        d.ellipse((x,y,x+2,y+2),fill=rng.choice(["#789aac","#acc3c9","#3b667e"]))
    poly(d,[(0,344),(94,339),(181,310),(263,326),(345,317),(440,336),(540,311),(540,805),(0,805)],"#38394b","#242b3b")
    d.line([(0,344),(94,339),(181,310),(263,326),(345,317),(440,336),(540,311)],fill="#b4cacf",width=7)
    for _ in range(850):
        x,y=rng.randrange(W),rng.randrange(348,803)
        d.line((x,y,x+rng.randrange(1,7),y-2),fill=rng.choice(["#444455","#303343"]))
    d.rounded_rectangle((48,408,498,793),radius=121,fill="#171e2b",outline="#686171",width=6)
    for y in (512,585,656):
        d.rectangle((75,y,223,y+9),fill="#7e6d72")
        d.line((80,y,218,y),fill="#adb0aa",width=2)
    d.line((80,491,80,689),fill="#63525e",width=8)
    d.line((217,491,217,689),fill="#63525e",width=8)
    for x,y,w,h in [(379,641,89,96),(357,574,75,67),(408,525,54,64),(368,465,65,66),(312,693,70,52)]:
        box(d,x,y,w,h,True)
    glow=Image.new("RGBA",im.size)
    ImageDraw.Draw(glow).ellipse((182,609,360,786),fill=(83,178,209,100))
    layer=glow.filter(ImageFilter.GaussianBlur(40))
    im.paste(layer,(0,0),layer)
    ant(d,259,671,.76,"winter")
    poly(d,[(216,709),(254,700),(271,734),(228,747)],"#97e6ec","#234656",4)
    d.line((229,715,248,710),fill="#f8edc7",width=3)
    caption(d,"18","EMPTY WINTER","เสบียงหมด เหลือแต่กล่องเปล่า",True)
    return im

for name,make in [("01-clay-checkout",clay),("02-parcel-panic",comic),("03-empty-winter",winter)]:
    make().resize((1080,1920),Image.Resampling.LANCZOS).save(OUT/f"{name}.png")
