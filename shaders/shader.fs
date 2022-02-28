#version 300 es

precision highp float;
precision highp usampler2D;

uniform sampler2D color_sampler;
uniform sampler2D shadowMap_sampler;
uniform mat4 shadowMapMatrix;
uniform vec3 shadowMapPosition;
uniform mat3 rotationMatrix;

in vec2 var_texCoord;
in vec3 var_normal;
in vec3 var_shadowMapCoord;

out vec4 out_color;
void main()
{  

    
    vec3 light=rotationMatrix*vec3(0.0,0.0,-1.0);
    vec4 colorTexture = texture(color_sampler, var_texCoord);
    if(colorTexture.a<0.9)
    {
        discard;
    }
    vec3 colorTexture3 = vec3(colorTexture);
    vec2 shadowMapCoordinates = (var_shadowMapCoord.xy);
    if(
        shadowMapCoordinates.x<=1.0
        &&
        shadowMapCoordinates.y<=1.0
        &&
        shadowMapCoordinates.x>=-1.0
        &&
        shadowMapCoordinates.y>=-1.0
     )
     {
        
        vec3 lightOriginToPosition = var_shadowMapCoord-vec3(0.0,0.0,-1.0);
        float distanceFromLight = lightOriginToPosition.z/2.0;

        float shadowMapDepth = float(texture(shadowMap_sampler, (shadowMapCoordinates+vec2(1.0,1.0))/2.0).r);
        //out_color = vec4(distanceFromLight,distanceFromLight,distanceFromLight,1.0);
        
        if(distanceFromLight<shadowMapDepth+0.01)
         {
            out_color = vec4(dot(var_normal,light)*colorTexture3*0.8+colorTexture3*0.2,1.0);//lit
         }
         else{
            out_color = vec4(+colorTexture3*0.2,1.0);//lit
         }
        //out_color = vec4(distanceFromLight,0.0,0.0,1.0);
     }
     else{

        out_color = vec4(dot(var_normal,light)*colorTexture3*0.7+colorTexture3*0.3,1.0);
    }
    

}