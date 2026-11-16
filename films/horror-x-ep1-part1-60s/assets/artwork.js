// Original vector artwork. Every group remains independently animatable.
// This phase deliberately renders a single design keyframe, not a film.
const line = (d, color='#68849b', width=2, opacity=1) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
const rect = (x,y,w,h,fill,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const text = (x,y,s,size,fill='#b7d1df',extra='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;

function washer(x,y,s,id) {
 return `<g transform="translate(${x} ${y}) scale(${s})" stroke-linejoin="round">
 <path d="M0 14L151 0 169 17V234L9 248 0 235Z" fill="#182c3e" stroke="#0e1c2a" stroke-width="4"/>
 <path d="M9 25L157 12V231L9 245Z" fill="url(#metal)" stroke="#6d8d9f" stroke-width="1.5"/>
 <path d="M9 25L157 12V62L9 75Z" fill="#668b9e"/>
 <path d="M10 72L157 59" stroke="#b2d1df" opacity=".35"/>
 <path d="M20 39L68 35V52L20 56Z" fill="#283f51" stroke="#a0b8c4" stroke-width="1"/>
 <path d="M23 44L62 40" stroke="#c5dbe3" stroke-width="2"/>
 <path d="M91 32L126 29V48L91 51Z" fill="#0b1b27"/>
 <text x="96" y="44" fill="#a8d9d7" font-size="10" font-family="monospace">${id===1?'28':'--'}</text>
 <circle cx="140" cy="36" r="5" fill="#7baab7"/><circle cx="140" cy="36" r="2" fill="#cfebed"/>
 <ellipse cx="83" cy="148" rx="61" ry="65" fill="#0b1723" stroke="#8baebf" stroke-width="5"/>
 <ellipse cx="83" cy="148" rx="52" ry="56" fill="url(#drum)" stroke="#314f64" stroke-width="4"/>
 <ellipse cx="83" cy="148" rx="44" ry="48" fill="#0a1a29"/>
 <path d="M51 151Q49 119 78 119L95 139 117 153 101 178 78 180 74 155Z" fill="#9baeb3" opacity="${id===1?'.8':'.29'}"/>
 <path d="M53 148Q81 131 88 160T109 168L94 180 69 175Z" fill="#dae6e5" opacity="${id===1?'.6':'.15'}"/>
 <path d="M47 139Q48 112 70 107M100 190Q121 180 124 160" fill="none" stroke="#c7e7eb" stroke-width="3" opacity=".32"/>
 <path d="M133 138v20" stroke="#d3e2e6" stroke-width="5" stroke-linecap="round"/>
 <path d="M22 217L145 205M22 224L144 212" stroke="#152a3a" stroke-width="3"/>
 <text x="20" y="92" font-size="10" fill="#c1d3dc" opacity=".7">0${id}</text>
 </g>`;
}

export function renderApprovedArtwork() {
 let tiles='';
 for(let i=0;i<12;i++)tiles+=line(`M${120+i*90} 1340L${508+i*5} 1000`,'#7694a4',1,.17);
 for(let i=0;i<8;i++){const yy=1020+Math.pow(i/7,1.6)*325;tiles+=line(`M125 ${yy}H963`,'#7396a5',1,.2);}
 let bricks='';
 for(let j=0;j<20;j++){const y=270+j*48;bricks+=line(`M91 ${y}H1010`,'#6c7d85',1,.08);for(let i=0;i<8;i++)bricks+=line(`M${85+i*145+(j%2)*71} ${y}v48`,'#6c7d85',1,.08);}
 let sidewalk='';
 for(let i=0;i<10;i++)sidewalk+=line(`M${-400+i*200} 1740L${100+i*110} 1392`,'#758a98',2,.15);
 let sh=['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" role="img" aria-label="ร้านซักผ้าเปิด 24 ชั่วโมงริมถนนว่างยามดึก แสงนีออนเย็นส่องผ่านกระจก ไม่มีคนหรือผี">',
 `<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#111f32"/><stop offset="1" stop-color="#293b50"/></linearGradient>
 <linearGradient id="wall" x2=".9" y2="1"><stop stop-color="#364859"/><stop offset=".5" stop-color="#253747"/><stop offset="1" stop-color="#172938"/></linearGradient>
 <linearGradient id="inside" x2="0" y2="1"><stop stop-color="#29495e"/><stop offset=".5" stop-color="#436478"/><stop offset="1" stop-color="#0d2333"/></linearGradient>
 <linearGradient id="floor" x2=".25" y2="1"><stop stop-color="#325064"/><stop offset=".75" stop-color="#526f7d"/><stop offset="1" stop-color="#233a49"/></linearGradient>
 <linearGradient id="metal" x2="1" y2=".2"><stop stop-color="#7193a4"/><stop offset=".45" stop-color="#506f83"/><stop offset="1" stop-color="#2c495f"/></linearGradient>
 <linearGradient id="drum" x2=".8" y2="1"><stop stop-color="#7199aa"/><stop offset=".4" stop-color="#132b3c"/><stop offset="1" stop-color="#467184"/></linearGradient>
 <linearGradient id="glass" x2="1" y2=".5"><stop stop-color="#c4e9ed" stop-opacity=".11"/><stop offset=".48" stop-color="#c4e9ed" stop-opacity=".01"/><stop offset="1" stop-color="#a2d4df" stop-opacity=".15"/></linearGradient>
 <linearGradient id="road" x2="0" y2="1"><stop stop-color="#172b3a"/><stop offset="1" stop-color="#0b1420"/></linearGradient>
 <linearGradient id="spill" x2="0" y2="1"><stop stop-color="#b0e1eb" stop-opacity=".25"/><stop offset="1" stop-color="#91c9df" stop-opacity="0"/></linearGradient>
 <radialGradient id="halo"><stop stop-color="#aadcea" stop-opacity=".25"/><stop offset="1" stop-color="#82c0dd" stop-opacity="0"/></radialGradient>
 <radialGradient id="vignette" cx=".48" cy=".51" r=".72"><stop offset=".43" stop-color="#050d18" stop-opacity="0"/><stop offset="1" stop-color="#050d18" stop-opacity=".72"/></radialGradient>
 <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
 <clipPath id="shop"><path d="M151 742L947 715V1331L151 1363Z"/></clipPath>
 </defs>`,
 `<g id="distant">${rect(0,0,1080,1920,'url(#sky)')}
 <path d="M0 180L85 201V1321H0ZM1001 159L1080 130V1360L998 1322Z" fill="#101c2a"/>
 ${line('M0 198Q520 350 1080 194','#08121e',7)}${line('M0 225Q480 402 1080 256','#0a1420',4)}${line('M45 0L55 1290','#09131f',11)}
 <path d="M51 141H120V151H52M34 161H86V169H35" stroke="#0a1520" stroke-width="8"/>
 </g>`,
 `<g id="facade">
 <path d="M86 267L999 237 1022 1407 69 1442Z" fill="url(#wall)" stroke="#0b1926" stroke-width="9"/>
 ${bricks}
 <path d="M78 270L1000 238 1011 309 76 342Z" fill="#1b2b3a"/>
 ${line('M89 276L999 247','#6b7b84',3,.5)}
 <path d="M130 355L407 348V534L130 543Z" fill="#101c28" stroke="#4b6273" stroke-width="5"/>
 <path d="M151 373L387 368V512L151 521Z" fill="#1f3244"/>
 ${line('M266 371V517M151 443L385 436','#0d1c2a',9)}
 <path d="M163 380L251 379V434L163 438Z" fill="#4c6572" opacity=".25"/>
 <path d="M277 450L379 446V507L277 511Z" fill="#0c1722"/>
 <path d="M694 349L936 342V521L694 529Z" fill="#132332" stroke="#4f6574" stroke-width="4"/>
 <path d="M707 361L923 355V510L707 516Z" fill="#2d4353"/>
 ${Array.from({length:11},(_,i)=>line(`M709 ${370+i*12}L922 ${364+i*12}`,'#647785',3,.35)).join('')}
 <path d="M938 362V575Q939 600 969 600V1358" fill="none" stroke="#122637" stroke-width="15"/>
 ${line('M935 363V575Q938 604 966 603V1356','#79909b',2,.42)}
 <path d="M117 579L966 552 989 700 104 731Z" fill="#0d1c29" stroke="#567284" stroke-width="3"/>
 <path d="M129 593L952 568 970 683 117 714Z" fill="#2e4d60"/>
 <path d="M134 595L949 571 951 588 131 612Z" fill="#658b9c" opacity=".4"/>
 ${text(168,665,'ซัก • อบ',65,'#d3e7ed','letter-spacing="4"')}
 ${text(655,630,'เปิด 24 ชั่วโมง',28,'#b8d5df')}
 ${text(659,663,'บริการตนเอง',21,'#a9c6d2','letter-spacing="2"')}
 <path d="M105 729L991 699 1010 747 92 780Z" fill="#182c3b"/>
 ${line('M100 744L995 713','#aacbd6',3,.65)}
 </g>`,
 `<g id="interior" clip-path="url(#shop)">
 ${rect(120,710,850,660,'url(#inside)')}
 <path d="M140 749L519 851 958 739V715H140Z" fill="#20394c"/>
 <path d="M140 749L519 851V1112L140 1229Z" fill="#38596d"/>
 <path d="M519 851L960 741V1198L519 1112Z" fill="#2c485d"/>
 ${line('M523 865V1109','#a3c1ca',2,.23)}
 ${Array.from({length:6},(_,i)=>line(`M147 ${851+i*50}L516 ${919+i*33}`,'#7a99a9',1,.18)).join('')}
 <path d="M140 1228L519 1112 963 1195V1366H140Z" fill="url(#floor)"/>${tiles}
 <path d="M607 878L711 854V1123L607 1106Z" fill="#0b1d2a" stroke="#68828f" stroke-width="3"/>
 <path d="M620 886L699 868V1115L620 1102Z" fill="#102333"/>
 <path d="M630 998L688 987V999L630 1009Z" fill="#071420"/>
 ${line('M677 1043l13-2','#9aafb7',4,.7)}
 <path d="M606 1111L712 1127" stroke="#6d9e96" stroke-width="2" opacity=".4"/>
 <g transform="translate(765 899)"><ellipse rx="24" ry="27" fill="#172d3c" stroke="#a9bec6" stroke-width="3"/><ellipse rx="19" ry="22" fill="#bccdd0"/><path d="M0-15V0L-10-6" stroke="#1a3040" stroke-width="2"/><circle r="2" fill="#243c4a"/></g>
 <path d="M791 1006L881 987V1158L791 1139Z" fill="#1b3244" stroke="#8ba4b0" stroke-width="2"/>
 <path d="M803 1020L866 1008V1065L803 1075Z" fill="#426878"/>
 <path d="M814 1091L851 1087V1103L814 1108Z" fill="#0c1e2d"/>
 <path d="M794 1145L878 1164" stroke="#7197a7" stroke-width="2"/>
 ${washer(182,1003,1.05,1)}${washer(361,1007,.77,2)}${washer(491,1009,.55,3)}
 <path d="M749 1186L855 1165 950 1205 840 1233Z" fill="#79909a" stroke="#203b4d" stroke-width="3"/>
 <path d="M750 1186L840 1233V1345L749 1293Z" fill="#2b475b"/>
 <path d="M840 1233L949 1205V1316L840 1345Z" fill="#213b4e"/>
 <path d="M866 1197L902 1189 920 1197 883 1206Z" fill="#a98b76" opacity=".65"/>
 <path d="M303 789L518 843" stroke="#b7e8f4" stroke-width="17" filter="url(#bloom)"/>
 <path d="M303 789L518 843" stroke="#b3d7e2" stroke-width="9"/>
 <path d="M305 787L515 840" stroke="#ecf9fc" stroke-width="4"/>
 <path d="M729 797L855 766" stroke="#b7e8f4" stroke-width="14" filter="url(#bloom)"/>
 <path d="M730 796L854 765" stroke="#d7f0f5" stroke-width="5"/>
 <ellipse cx="470" cy="1007" rx="375" ry="295" fill="url(#halo)"/>
 </g>`,
 `<g id="storefront">
 <path d="M130 751L151 751V1367L128 1370Z" fill="#142c3d"/>
 <path d="M150 751L948 723V1331L150 1365Z" fill="url(#glass)"/>
 <path d="M443 743V1352M732 732V1340" stroke="#0e2434" stroke-width="14"/>
 ${line('M449 747V1349M738 737V1338','#a1c2ce',2,.6)}
 <path d="M945 723L970 721V1343L945 1345Z" fill="#173043"/>
 ${line('M945 728V1339','#a5c7d3',2,.5)}
 <path d="M147 1359L965 1328V1354L145 1390Z" fill="#101e2d"/>
 <path d="M114 1390L988 1353 1009 1387 91 1434Z" fill="#465e70" stroke="#142536" stroke-width="3"/>
 <path d="M91 1434L1009 1387V1422L91 1472Z" fill="#243b4e"/>
 ${line('M112 1396L984 1360','#9db7c2',3,.65)}
 ${line('M905 991V1083','#0d2334',13)}${line('M902 989V1080','#aecbd5',5)}
 <path d="M501 854L697 847V970L501 979Z" fill="#0f2637" stroke="#5c8d9f" stroke-width="2"/>
 <path d="M515 865L684 859V956L515 965Z" fill="none" stroke="#93c7df" stroke-width="2" opacity=".55"/>
 ${text(532,909,'OPEN',35,'#c3eff8','letter-spacing="4" transform="rotate(-2 532 909)"')}
 ${text(552,946,'24 ชม.',25,'#a8d6e7','transform="rotate(-2 552 946)"')}
 <path d="M525 850V791M672 847V802" stroke="#293e4d" stroke-width="2"/>
 <g opacity=".1" transform="translate(1200 0) scale(-1 1)">${text(532,1012,'OPEN',35,'#c3eff8','letter-spacing="4"')}</g>
 <path d="M164 843L237 834 439 1192V1304L409 1306Z" fill="#b6dce6" opacity=".045"/>
 <path d="M761 747L785 745 940 1044V1110Z" fill="#c7e5ed" opacity=".055"/>
 ${line('M163 768L431 757M460 753L722 743','#b9dae3',2,.35)}
 </g>`,
 `<g id="street">
 <path d="M0 1475L1080 1410V1920H0Z" fill="url(#road)"/>
 <path d="M0 1475L1080 1410V1575L0 1644Z" fill="#344b5c"/>
 ${sidewalk}
 ${line('M0 1559L1080 1496M0 1611L1080 1544','#91a5ae',2,.2)}
 <path d="M0 1642L1080 1573V1595L0 1665Z" fill="#0c1b29"/>
 ${line('M0 1643L1080 1574','#617d8c',4,.6)}
 <path d="M152 1455L964 1417 1050 1785 58 1845Z" fill="url(#spill)"/>
 <path d="M258 1537L552 1519 721 1804 257 1820Z" fill="url(#spill)" opacity=".2"/>
 <path d="M42 1760Q290 1749 459 1767T1009 1736L1004 1746Q733 1776 490 1780T44 1771Z" fill="#7297ab" opacity=".13"/>
 ${line('M120 1713l119-5m81-4l68-4m327-7l122-7M420 1848l200-7','#88a6b8',2,.16)}
 <path d="M-30 1874L262 1858 270 1880-30 1900ZM843 1818L1110 1803V1825L849 1841Z" fill="#81929b" opacity=".16"/>
 <path d="M3 1350L44 1348 52 1562 1 1565Z" fill="#102231"/>
 <path d="M1031 1410L1080 1403V1601L1038 1605Z" fill="#0a1926"/>
 </g>`,
 `<g id="atmosphere"><ellipse cx="538" cy="1234" rx="485" ry="386" fill="url(#halo)" opacity=".2"/>
 ${rect(0,0,1080,1920,'url(#vignette)')}
 </g></svg>`];
 return sh.join('');
}
