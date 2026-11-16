// Nun — original storybook character for the interior shot (17.6–30 s).
// Pure deterministic SVG inner markup on the full 1080x1920 artboard.
// Head center (790,850), shoulders ~y970, hands rest over the counter top y=1200.
// Body is clipped above the counter line; no feet are drawn.
const N_CREAM='#E7D6BF', N_CREAM_SH='#C9AC8E', N_INK='#101A26', N_SHIRT='#25384E',
      N_SHIRT_D='#1B2B3D', N_APRON='#D9E2EA', N_COPPER='#B18270', N_COPPER_D='#7E5847',
      N_ICE='#8FB2D4';

const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,k)=>a+(b-a)*k;
const sstep=k=>{k=clamp(k,0,1);return k*k*(3-2*k);};
// trapezoid envelope: 0 before a, ramps in over fi, 1 until b-fo, ramps out over fo
const env=(t,a,b,fi=.6,fo=.6)=>t<=a?0:t>=b?0:Math.min(sstep((t-a)/fi),sstep((b-t)/fo));
// piecewise smooth position track: keys = [[t,x,y],...]
function track(t,keys){
  if(t<=keys[0][0])return[keys[0][1],keys[0][2]];
  for(let i=1;i<keys.length;i++){
    if(t<=keys[i][0]){
      const k=sstep((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]));
      return[lerp(keys[i-1][1],keys[i][1],k),lerp(keys[i-1][2],keys[i][2],k)];
    }
  }
  const l=keys[keys.length-1];return[l[1],l[2]];
}

const REST_L=[742,1182], REST_R=[838,1182];
const HAND_L=[[0,...REST_L],[25.3,...REST_L],[26.3,754,1179],[27.6,756,1183],[30,756,1183]];
const HAND_R=[[0,...REST_R],[23.9,...REST_R],[24.9,817,1174],[25.9,771,1183],[26.7,800,1189],[27.8,...REST_R],[30,...REST_R]];
const COINS=[[0,812,1192],[24,812,1192],[24.9,816,1176],[25.8,772,1183],[26.4,761,1184],[30,761,1185]];

export function renderNun(t){
  t=clamp(Number(t)||0,0,30);
  const breath=Math.sin(2*Math.PI*t/3.4);
  const torsoDy=(1.5*breath).toFixed(2);
  // blink: three soft blinks across the interior shot
  let blink=0;
  for(const c of[19.2,22.9,26.6]){const u=(t-c)/0.075;const g=Math.exp(-u*u);if(g>blink)blink=g;}
  const open=(1-0.94*blink).toFixed(3);
  // glance toward washer 03 (left of her)
  const glance=env(t,20.2,23.8,.6,.7);
  const headRot=(-3.6*glance+0.5*Math.sin(2*Math.PI*t/7.1)).toFixed(2);
  const pupilDx=(-7*glance).toFixed(1), pupilDy=(2*glance).toFixed(1);
  const [hxL,hyL]=track(t,HAND_L), [hxR,hyR]=track(t,HAND_R), [cx,cy]=track(t,COINS);
  const coinRot=(16*Math.sin(Math.PI*clamp((t-24)/3,0,1))).toFixed(1);
  // arm elbows drift outward with reach
  const reachR=clamp(Math.hypot(hxR-REST_R[0],hyR-REST_R[1])/46,0,1);
  const reachL=clamp(Math.hypot(hxL-REST_L[0],hyL-REST_L[1])/30,0,1);

  const arm=(sx,sy,hx,hy,reach,flip)=>{
    const mx=(sx+hx)/2,my=(sy+hy)/2;
    const dx=hx-sx,dy=hy-sy,len=Math.hypot(dx,dy)||1;
    const px=-dy/len*(20+12*reach)*flip, py=dx/len*(20+12*reach)*flip;
    const ex=mx+px,ey=my+py, wx=lerp(ex,hx,.82), wy=lerp(ey,hy,.82);
    return `<path d="M${sx} ${sy} Q${ex.toFixed(1)} ${ey.toFixed(1)} ${wx.toFixed(1)} ${wy.toFixed(1)}" fill="none" stroke="${N_SHIRT}" stroke-width="34" stroke-linecap="round"/>
<path d="M${wx.toFixed(1)} ${wy.toFixed(1)} L${hx.toFixed(1)} ${hy.toFixed(1)}" fill="none" stroke="${N_CREAM}" stroke-width="19" stroke-linecap="round"/>
<ellipse cx="${hx.toFixed(1)}" cy="${(hy-4).toFixed(1)}" rx="14" ry="10.5" fill="${N_CREAM}"/>
<path d="M${(hx-6).toFixed(1)} ${(hy-6).toFixed(1)} q3 4 1 8 M${(hx+5).toFixed(1)} ${(hy-6).toFixed(1)} q3 4 1 8" fill="none" stroke="${N_CREAM_SH}" stroke-width="1.6" opacity=".7"/>`;
  };

  return `<defs>
<linearGradient id="nun-skin" x2="0" y2="1"><stop stop-color="#EFDFC9"/><stop offset="1" stop-color="#D9BEA2"/></linearGradient>
<linearGradient id="nun-hair" x2="0" y2="1"><stop stop-color="#1B2740"/><stop offset="1" stop-color="#0B1220"/></linearGradient>
<linearGradient id="nun-shirt" x2="0" y2="1"><stop stop-color="#2C4260"/><stop offset="1" stop-color="#1C2D42"/></linearGradient>
<linearGradient id="nun-apron" x2="0" y2="1"><stop stop-color="#E4EAF1"/><stop offset="1" stop-color="#C4D2DF"/></linearGradient>
<clipPath id="nun-safe"><rect x="0" y="0" width="1080" height="1210"/></clipPath>
</defs>
<g clip-path="url(#nun-safe)">
<g transform="translate(0 ${torsoDy})">
<path d="M700 972 C688 1032 668 1102 656 1182 L924 1182 C912 1102 892 1032 880 972 C858 960 818 955 790 955 C762 955 722 960 700 972 Z" fill="url(#nun-shirt)"/>
<path d="M700 972 C688 1032 668 1102 656 1182" fill="none" stroke="#8FB2D4" stroke-width="2" opacity=".28"/>
<path d="M884 976 L790 1030 L696 976 L706 966 L790 1018 L874 966 Z" fill="${N_SHIRT_D}"/>
<path d="M712 974 L790 1024 L868 974" fill="none" stroke="${N_COPPER}" stroke-width="2.4" opacity=".85"/>
<path d="M730 1002 L850 1002 L872 1196 L708 1196 Z" fill="url(#nun-apron)"/>
<path d="M730 1002 L850 1002" stroke="${N_COPPER}" stroke-width="2.4" opacity=".7"/>
<path d="M742 1020 L838 1020 M742 1052 L838 1052" stroke="#A9BECB" stroke-width="1.4" opacity=".5"/>
<path d="M708 1196 L872 1196" stroke="${N_COPPER}" stroke-width="2.2" opacity=".55"/>
<path d="M762 1004 L764 1194 M816 1004 L814 1194" stroke="#9FB2C2" stroke-width="1.2" opacity=".4"/>
</g>
${arm(706,982,hxL,hyL,reachL,1)}
${arm(874,982,hxR,hyR,reachR,-1)}
<g transform="rotate(${coinRot} ${cx.toFixed(1)} ${cy.toFixed(1)})">
<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="10.5" ry="4.2" fill="${N_COPPER}" stroke="${N_COPPER_D}" stroke-width="1.2"/>
<ellipse cx="${(cx-1.5).toFixed(1)}" cy="${(cy-1).toFixed(1)}" rx="5" ry="1.8" fill="#D8A98F" opacity=".8"/>
<ellipse cx="${(cx+4).toFixed(1)}" cy="${(cy+1.6).toFixed(1)}" rx="9" ry="3.6" fill="${N_COPPER}" stroke="${N_COPPER_D}" stroke-width="1.1" opacity=".95"/>
</g>
<g transform="translate(0 ${(0.8*breath).toFixed(2)}) rotate(${headRot} 790 958)">
<ellipse cx="790" cy="946" rx="30" ry="26" fill="${N_CREAM}"/>
<path d="M764 962 Q790 972 816 962 L818 978 Q790 988 762 978 Z" fill="${N_CREAM_SH}" opacity=".55"/>
<ellipse cx="790" cy="856" rx="94" ry="106" fill="url(#nun-hair)"/>
<path d="M712 806 C700 862 706 928 726 968 C716 974 704 966 704 950 C696 902 700 848 716 806 Z" fill="url(#nun-hair)"/>
<path d="M868 806 C880 862 874 928 854 968 C864 974 876 966 876 950 C884 902 880 848 864 806 Z" fill="url(#nun-hair)"/>
<ellipse cx="790" cy="858" rx="70" ry="86" fill="url(#nun-skin)"/>
<ellipse cx="766" cy="892" rx="13" ry="8" fill="${N_COPPER}" opacity=".16"/>
<ellipse cx="814" cy="892" rx="13" ry="8" fill="${N_COPPER}" opacity=".16"/>
<path d="M716 842 C714 782 750 756 790 756 C830 756 866 782 864 842 C858 820 848 808 832 804 C844 822 846 830 844 842 C830 828 812 822 790 822 C768 822 750 828 736 842 C734 830 736 822 748 804 C732 808 722 820 716 842 Z" fill="url(#nun-hair)"/>
<path d="M744 812 Q757 802 771 809 M809 809 Q823 802 836 812" fill="none" stroke="#241A12" stroke-width="4.2" stroke-linecap="round"/>
<g transform="translate(${pupilDx} ${pupilDy})">
<g transform="translate(761 848) scale(1 ${open}) translate(-761 -848)">
<ellipse cx="761" cy="848" rx="11" ry="8" fill="#F4EEE2"/>
<circle cx="762.5" cy="849" r="5.4" fill="#33291F"/><circle cx="764" cy="846.5" r="1.6" fill="#EAF4FF"/>
</g>
<g transform="translate(819 848) scale(1 ${open}) translate(-819 -848)">
<ellipse cx="819" cy="848" rx="11" ry="8" fill="#F4EEE2"/>
<circle cx="820.5" cy="849" r="5.4" fill="#33291F"/><circle cx="822" cy="846.5" r="1.6" fill="#EAF4FF"/>
</g>
</g>
<path d="M788 862 q5 9 -1 13" fill="none" stroke="#C4A98C" stroke-width="2.2" stroke-linecap="round"/>
<path d="M774 901 Q782 896 790 899 Q798 896 806 901" fill="none" stroke="#96604F" stroke-width="3" stroke-linecap="round"/>
<path d="M740 826 C736 800 760 780 790 780 M840 826 C844 800 820 780 790 780" fill="none" stroke="${N_ICE}" stroke-width="1.6" opacity=".3"/>
</g>
</g>`;
}
