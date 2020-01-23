float SDFPentagon(vec2 _st, float radius)
{
	_st -= .5;
	_st.y *= -1.;
    const vec3 k = vec3(0.809016994,0.587785252,0.726542528);
    _st.x = abs(_st.x);
    _st -= 2.0*min(dot(vec2(-k.x,k.y),_st),0.0)*vec2(-k.x,k.y);
    _st -= 2.0*min(dot(vec2( k.x,k.y),_st),0.0)*vec2( k.x,k.y);
    _st -= vec2(clamp(_st.x,-radius*k.z,radius*k.z),radius);    
    return length(_st)*sign(_st.y);
}

#pragma glslify: export(SDFPentagon)