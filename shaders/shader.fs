#version 300 es

precision highp float;

uniform sampler2D color_sampler;

in vec2 var_texCoord;
in vec3 var_normal;

out vec4 out_color;
void main()
{  
    vec3 light=normalize(-vec3(1.0,-1.0,0.0));
    vec4 colorTexture = texture(color_sampler, var_texCoord);
    if(colorTexture.a<0.9)
    {
        discard;
    }
    vec3 colorTexture3 = vec3(colorTexture);
    out_color = vec4(dot(var_normal,light)*colorTexture3*0.7+colorTexture3*0.3,1.0);
    

}