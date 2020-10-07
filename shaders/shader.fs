#version 300 es

precision highp float;

uniform sampler2D color_sampler;

in vec2 var_texCoord;

out vec4 out_color;
void main()
{  
     
    out_color = texture(color_sampler, var_texCoord);
    if(out_color.a<0.9)
    {
        discard;
    }

}