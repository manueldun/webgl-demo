#version 300 es

layout(location = 0) in vec3 attrib_position;
layout(location = 1) in vec3 attrib_normal;
layout(location = 2) in vec2 attrib_texCoord;
layout(location = 3) in vec3 attrib_tangent;

uniform mat4 mvp;
uniform mat4 rotationMatrix;

out vec2 var_texCoord;
out vec3 var_normal;
void main()
{
    var_normal = attrib_normal;
    var_texCoord = attrib_texCoord;
    gl_Position = mvp*vec4(attrib_position,1.0);
}