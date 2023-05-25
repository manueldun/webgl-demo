#version 300 es

layout(location = 0) in vec3 attrib_position;
layout(location = 1) in vec3 attrib_normal;
layout(location = 2) in vec2 attrib_texCoord;
layout(location = 3) in vec4 attrib_tangent;



uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

//shadowmMap related
uniform mat4 shadowMapMatrix;
uniform mat3 rotationMatrix;

out vec3 var_position;
out vec2 var_texCoord;
out vec3 var_normal;
out vec3 var_shadowMapCoord;
out vec3 var_tangent;
out vec3 var_position_wolrd;
void main()
{
    vec4 shadowMapProjection=shadowMapMatrix*modelMatrix*vec4(attrib_position,1.0);
    var_shadowMapCoord=shadowMapProjection.xyz/shadowMapProjection.w;
    var_normal = attrib_normal;
    var_texCoord = attrib_texCoord;
    var_tangent = attrib_tangent.xyz;
    var_position_wolrd = attrib_position;
    var_position = (modelMatrix*vec4(attrib_position,1.0)).xyz;
    gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(attrib_position,1.0);
}