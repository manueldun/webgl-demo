#version 300 es

precision highp float;
precision highp usampler2D;

uniform sampler2D normal_sampler;
uniform sampler2D shadowMap_sampler;
uniform mat4 shadowMapMatrix;
uniform vec3 shadowMapPosition;
uniform mat3 rotationMatrix;
uniform vec3 cameraPosition;
uniform sampler2D color_sampler;
uniform sampler2D metallicRoughness;

in vec3 var_position;
in vec2 var_texCoord;
in vec3 var_normal;
in vec3 var_shadowMapCoord;
in vec3 var_tangent;

out vec4 out_color;
const int sampleSizeConstant = 2;
const int sampleStartSample = -sampleSizeConstant;
const int sampleEndSample = sampleSizeConstant;


const float PI = 3.14159265359;
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}  
void main()
{  
   float metallic = texture(metallicRoughness,var_texCoord).b;
   float roughness = texture(metallicRoughness,var_texCoord).g;

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
   vec3 albedo = pow(colorTextureWithAlpha.rgb,vec3(2.2));
   vec3 normalTexture = (texture(normal_sampler,var_texCoord).rgb);
   normalTexture=(normalTexture.rgb-vec3(0.5f))*2.0f;
   vec3 normal = TBN*normalTexture;

   vec3 radiance = vec3(5.0);
   // cook-torrance brdf
   
   vec3 F0 = vec3(0.04); 
   F0 = mix(F0, albedo, metallic);

   vec3 N = normalize(normal);
   vec3 V = normalize(-cameraPosition - var_position);
   vec3 L = light;
   vec3 H = normalize(V + L);
   vec3 Lo = vec3(0.0);
   float NDF = DistributionGGX(N, H, roughness);        
   float G   = GeometrySmith(N, V, L, roughness);      
   vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);       
   
   vec3 kS = F;
   vec3 kD = vec3(1.0) - kS;
   kD *= 1.0 - metallic;	  
   
   vec3 numerator    = NDF * G * F;
   float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
   vec3 specular     = numerator / denominator;  
      
   // add to outgoing radiance Lo
   float NdotL = max(dot(N, L), 0.0);                
   Lo = (kD * albedo / PI + specular) * radiance * NdotL; 

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

      out_color = vec4(Lo*shadowWeight+albedo*0.001,1.0);

     }
     else{

         out_color = vec4(albedo*0.1f,1.0f);
    }
    

      float gamma = 2.2f;
      out_color.rgb = pow(out_color.rgb, vec3(1.0f/gamma));
}