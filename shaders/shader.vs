#version 300 es

layout(location = 0) in vec3 attrib_position;
layout(location = 1) in vec3 attrib_normal;
layout(location = 2) in vec2 attrib_texCoord;
layout(location = 3) in vec3 attrib_tangent;

uniform mat4 mvp;

out vec2 var_texCoord;
void main()
{
    var_texCoord = attrib_texCoord;
    gl_Position = mvp*vec4(attrib_position,1.0);
}