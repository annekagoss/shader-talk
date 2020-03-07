#ifdef GL_ES
precision mediump float;
#endif

// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// The source code for these videos from 2009: 
// https://www.youtube.com/watch?v=eKUh4nkmQbc
// https://www.youtube.com/watch?v=erS6SKqtXLY

// More info here: http://iquilezles.org/www/articles/mandelbulb/mandelbulb.htm

// See https://www.shadertoy.com/view/MdfGRr to see the Julia counterpart


// #if HW_PERFORMANCE == 0
// #define AA 1
// #else
#define AA 1  // make AA 1 for slow machines or 3 for fast machines
// #endif
#define ZERO 0

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uBackground;

vec2 isphere(vec4 sph, vec3 ro, vec3 rd )
{
    vec3 oc = ro - sph.xyz;
    
	float b = dot(oc,rd);
	float c = dot(oc,oc) - sph.w*sph.w;
    float h = b*b - c;
    
    if( h<0.0 ) return vec2(-1.0);

    h = sqrt( h );

    return -b + vec2(-h,h);
}

float map(vec3 p, out vec4 resColor )
{
    vec3 w = p;
    float m = dot(w,w);

    vec4 trap = vec4(abs(w),m);
	float dz = 1.0;
    
    
	for( int i=0; i<4; i++)
    {
		// float size = 8.0 + sin(uTime*0.001)*.3;
		float size = 8.0;
        dz = size*pow(sqrt(m),7.0)*dz + (20.0 * (sin(uTime*0.001) * 0.5 + 0.5));
       
        float r = length(w);
        float b = -size*acos((w.y/r)) + (uTime*0.001);
        float a = size*atan( w.x, w.z ) - (uTime*0.001);
        w = p + pow(r,size) * vec3( sin(b)*sin(a), cos(b), sin(b)*cos(a) );        
        
        trap = min( trap, vec4(abs(w),m) );

        m = dot(w,w);
		if( m > 256.0 )
            break;
    }

    resColor = vec4(m,trap.yzw);

    return 0.25*log(m)*sqrt(m)/dz;
}

float intersect(vec3 ro, vec3 rd, out vec4 rescol, float px)
{
    float res = -1.0;

    // bounding sphere
    vec2 dis = isphere( vec4(0.0,0.0,0.0,1.25), ro, rd );
    if( dis.y<0.0 )
        return -1.0;
    dis.x = max( dis.x, 0.0 );
    dis.y = min( dis.y, 10.0 );

    // raymarch fractal distance field
	vec4 trap;

	float t = dis.x;
	for( int i=0; i<128; i++  )
    { 
        vec3 pos = ro + rd*t;
        float th = 0.25*px*t;
		float h = map( pos, trap );
		if( t>dis.y || h<th ) break;
        t += h;
    }
    
    
    if( t<dis.y )
    {
        rescol = trap;
        res = t;
    }

    return res;
}

float softshadow(vec3 ro, vec3 rd, float k )
{
    float res = 1.0;
    float t = 0.0;
    for( int i=0; i<32; i++ )
    {
        vec4 kk;
        float h = map(ro + rd*t, kk);
        res = min( res, k*h/t );
        if( res<0.001 ) break;
        t += clamp( h, 0.01, 0.2 );
    }
    return clamp( res, 0.0, 1.0 );
}

vec3 calcNormal(vec3 pos, float t, float px )
{
    vec4 tmp;
    vec2 e = vec2(1.0,-1.0)*0.5773*0.25*px;
    return normalize( e.xyy*map( pos + e.xyy,tmp ) + 
					  e.yyx*map( pos + e.yyx,tmp ) + 
					  e.yxy*map( pos + e.yxy,tmp ) + 
					  e.xxx*map( pos + e.xxx,tmp ) );
}

const vec3 light1 = vec3(  0.577, 0.577, -0.577 );
const vec3 light2 = vec3( -0.707, 0.000,  0.707 );

// vec3 getEnvMap(vec3 rayDir) {
// 	vec3 texXY = texture2D(uBackground, rayDir.xy).xyz;
// 	vec3 texYZ = texture2D(uBackground, rayDir.xy).xyz;
// 	vec3 texXZ = texture2D(uBackground, rayDir.xy).xyz;
// 	vec3 tex = vec3(
// 		(texXY.x + texYZ.x + texXZ.x) / 3.0,
// 		(texXY.y + texYZ.y + texXZ.y) / 3.0,
// 		(texXY.z + texYZ.z + texXZ.z) / 3.0
// 	);
// 	tex = tex * tex; // gamma correct
// 	return tex;
// }

vec4 cubemap( sampler2D sam, vec3 d )
{
    // intersect cube
    vec3 n = abs(d);
    vec3 v = (n.x>n.y && n.x>n.z) ? d.xyz: 
             (n.y>n.x && n.y>n.z) ? d.yzx:
                                    d.zxy;
    // project into face
    vec2 q = v.yz/v.x;
    // undistort in the edges
    q *= 1.25 - 0.25*q*q;
    // sample
    return texture2D( sam, 0.5+0.5*q );
}

vec3 render(vec2 p, mat4 cam )
{
	// ray setup
    const float fle = 1.5;

    vec2  sp = (2.0*p-uResolution.xy) / uResolution.y;
    float px = 2.0/(uResolution.y*fle);

    vec3  ro = vec3( cam[0].w, cam[1].w, cam[2].w );
	vec3  rd = normalize( (cam*vec4(sp,fle,0.0)).xyz );

    // intersect fractal
	vec4 tra;
    float t = intersect( ro, rd, tra, px );
    
	vec3 col;

    // color sky
    if( t<0.0 )
    {
     	// col  = vec3(0.8,.9,1.1)*(0.6+0.4*rd.y);
		// col += 5.0*vec3(0.8,0.7,0.5)*pow( clamp(dot(rd,light1),0.0,1.0), 32.0 );
		col = vec3(1.0);
		
		// vec2 st = gl_FragCoord.xy/uResolution;
		// st.y = 1.0 - st.y;
		// col = texture2D(uBackground, st).xyz;
		
		// vec4 sc = vec4(0.0,0.0,0.0,5.0);
		
		// vec3 oc = ro - sc.xyz;
    
		// float b = dot(oc,rd);
		// float c = dot(oc,oc) - sc.w*sc.w;
		// float h = b*b - c;
		
		// vec3 nor = normalize(ro+h*rd-sc.xyz);
        // col = cubemap( uBackground, nor ).xyz;
	}
    // color fractal
	else
	{
        // color
        col = vec3(0.01);
		col = mix( col, vec3(0.10,0.20,0.30), clamp(tra.y,0.0,1.0) );
	 	col = mix( col, vec3(0.02,0.10,0.30), clamp(tra.z*tra.z,0.0,1.0) );
        col = mix( col, vec3(0.30,0.10,0.02), clamp(pow(tra.w,6.0),0.0,1.0) );
        col *= 0.5;
        
        // lighting terms
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos, t, px );
        vec3 hal = normalize( light1-rd);
        vec3 ref = reflect( rd, nor );
        float occ = clamp(0.05*log(tra.x),0.0,1.0);
        float fac = clamp(1.0+dot(rd,nor),0.0,1.0);

        // sun
        float sha1 = softshadow( pos+0.001*nor, light1, 32.0 );
        float dif1 = clamp( dot( light1, nor ), 0.0, 1.0 )*sha1;
        float spe1 = pow( clamp(dot(nor,hal),0.0,1.0), 32.0 )*dif1*(0.04+0.96*pow(clamp(1.0-dot(hal,light1),0.0,1.0),5.0));
        // bounce
        float dif2 = clamp( 0.5 + 0.5*dot( light2, nor ), 0.0, 1.0 )*occ;
        // sky
        float dif3 = (0.7+0.3*nor.y)*(0.2+0.8*occ);
        
		vec3 lin = vec3(0.0); 
		     lin += 7.0*vec3(1.50,1.10,0.70)*dif1;
		     lin += 4.0*vec3(0.25,0.20,0.15)*dif2;
        	 lin += 1.5*vec3(0.10,0.20,0.30)*dif3;
             lin += 2.5*vec3(0.35,0.30,0.25)*(0.05+0.95*occ); // ambient
        	 lin += 4.0*fac*occ;                          // fake SSS
		col *= lin;
		// col = pow( col, vec3(0.7,0.9,1.0) );                  // fake SSS
        col += spe1*15.0;

		// float b = dot(ro,rd);
		// float c = dot(ro,ro);
		// float h = b*b - c;
		// vec3 nor = normalize(ro+h*rd);
        col = mix(col, cubemap( uBackground, nor).xyz, clamp(pow(tra.w,3.0),0.0,1.0));
		col += mix(0.1, -0.1, -dot(-hal,nor));
		col.x = clamp(col.x, 0.125, 1.0);
		col.y = clamp(col.y, 0.125, 1.0);
		col.z = clamp(col.z, 0.125, 1.0);
		
		// col = getEnvMap(ref);
    }

    // gamma
	col = sqrt( col );
    
    // vignette
    //col *= 1.0 - 0.1255*length(sp);

    return col;
}

void main() {

	float time = uTime*0.0001;
	
    // camera
	float di =2.0+0.1*cos(.29*time);
	vec3  ro = di * vec3(cos(.33*time), 0.8*sin(.37*time), sin(.31*time));
	vec3  ta = vec3(0.0,0.1,0.0);
	float cr = 0.5*cos(0.1*time);

    // camera matrix
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cw = normalize(ta-ro);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv =          (cross(cu,cw));
    mat4 cam = mat4(cu, ro.x, cv, ro.y, cw, ro.z, 0.0, 0.0, 0.0, 1.0);

    // render
    #if AA<2
	vec3 col = render(gl_FragCoord.xy, cam);
    #else
    vec3 col = vec3(0.0);
    for(int j=ZERO; j<AA; j++)
    for(int i=ZERO; i<AA; i++)
    {
	    col += render(gl_FragCoord.xy + (vec2(i,j)/float(AA)), cam);
    }
	col /= float(AA*AA);
    #endif

	gl_FragColor = vec4(col, 1.0);
}