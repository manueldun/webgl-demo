#version 300 es

precision highp float;
precision highp usampler2D;

uniform sampler2D color_sampler;
uniform sampler2D normal_sampler;
uniform sampler2D shadowMap_sampler;
uniform mat4 shadowMapMatrix;
uniform vec3 shadowMapPosition;
uniform mat3 rotationMatrix;

in vec2 var_texCoord;
in vec3 var_normal;
in vec3 var_shadowMapCoord;
in vec3 var_tangent;

out vec4 out_color;
const int sampleSizeConstant = 2;
const int sampleStartSample = -sampleSizeConstant;
const int sampleEndSample = sampleSizeConstant;
void main()
{  
   vec3 meshNormal = vec3(var_normal.x,var_normal.y,-var_normal.z);
   vec3 meshTangent = vec3(var_tangent.x,var_tangent.y,var_tangent.z);
   vec3 bitangent = cross(normalize(var_tangent),normalize(var_normal));
   mat3 TBN = mat3(var_tangent,bitangent,var_normal);

   vec3 light=rotationMatrix*vec3(0.0,0.0,-1.0);
   vec4 colorTextureWithAlpha = texture(color_sampler, var_texCoord);
   if(colorTextureWithAlpha.a<0.9)
   {
      discard;
   }
   vec3 colorTexture = pow(colorTextureWithAlpha.rgb,vec3(2.2));
   vec3 normalTexture = (texture(normal_sampler,var_texCoord).rgb);
   normalTexture=(normalTexture.rgb-vec3(0.5f))*2.0f;
   vec3 normal = TBN*normalTexture;
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


      ivec2 textureSize= textureSize(shadowMap_sampler,0);
      vec2 sizeOfTexel = 1.0f/vec2(textureSize); 
      vec2 normalizedShadowMapCoordinates = (shadowMapCoordinates+vec2(1.0f,1.0f))/2.0f;
      float shadowMapDepth = float(texture(shadowMap_sampler,normalizedShadowMapCoordinates).r);
        
      float shadowWeight = 0.0f;
      for(int i=sampleStartSample;i<=sampleEndSample;i++)
      {
         for(int j=sampleStartSample;j<=sampleEndSample;j++)
         {
            vec2 coordDisplacement = normalizedShadowMapCoordinates+vec2(i,j)*sizeOfTexel;
            float shadowMapDepth = float(texture(shadowMap_sampler,coordDisplacement).r);
            
            if(distanceFromLight<shadowMapDepth+0.01)
            {
               shadowWeight+=1.0;
            }
         }
      }
      shadowWeight/=(float(sampleEndSample-sampleStartSample)+1.0f)*(float(sampleEndSample-sampleStartSample)+1.0f);

         out_color = vec4(max(dot(normal,light),0.0f)*colorTexture*shadowWeight*0.9+colorTexture*0.01f,1.0f);

     }
     else{

         out_color = vec4(colorTexture*0.1f,1.0f);
    }
    

      float gamma = 2.2f;
      out_color.rgb = pow(out_color.rgb, vec3(1.0f/gamma));
}