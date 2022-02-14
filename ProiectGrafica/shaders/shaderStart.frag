#version 410 core

in vec3 fNormal;
in vec4 fPosEye;
in vec2 fTexCoords;
in vec4 fragPosLightSpace;
in vec3 fFragPos;
in vec4 fVertPos;

out vec4 fColor;

//lighting
uniform	vec3 lightDir;
uniform	vec3 lightColor;

//texture
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;
uniform sampler2D shadowMap;

vec3 ambient;
float ambientStrength = 0.001f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float shininess = 32.0f;

uniform bool FogEnabled = true;

struct SpotLight
{
	vec3 Position;
	vec3 Direction;
	
	vec3 Ambient;
	vec3 Diffuse;
	vec3 Specular;

	float Constant;
	float Linear;
	float Quadratic;
	float InnerCutOff;
	float OuterCutOff;
};

vec3 CalcSpotLight(SpotLight Light, vec3 Normal, vec3 ViewDir);
uniform SpotLight USpotLight;

vec3 CalcSpotLight(SpotLight Light, vec3 Normal, vec3 ViewDir, inout bool IsInSpotLight)
{
	vec3 LightDir = normalize(Light.Position - fFragPos);
	float diff = max(dot(Normal, LightDir), 0.0);

	vec3 ReflectDir = reflect(-LightDir, Normal);
	float SpecAmount = pow(max(dot(ViewDir, ReflectDir), 0.0), shininess);

	vec3 Ambient = Light.Ambient * vec3(texture(diffuseTexture, fTexCoords));
	vec3 Diffuse = Light.Diffuse * diff * vec3(texture(diffuseTexture, fTexCoords));
	vec3 Specular = Light.Specular *SpecAmount * vec3(texture(specularTexture, fTexCoords));

	float Distance = length(Light.Position - fFragPos);
	float Attenuation = 1.0/(Light.Constant + Light.Linear * Distance + Light.Quadratic*(Distance*Distance));
	
	float Theta=dot(LightDir, normalize(-Light.Direction));
	float Epsilon = Light.InnerCutOff - Light.OuterCutOff;
	float Intensity = clamp((Theta-Light.OuterCutOff)/Epsilon, 0.0, 1.0);

	Diffuse*= Attenuation * Intensity;
	Specular*= Attenuation* Intensity;

	vec3 Result;
	if(Theta>Light.OuterCutOff)
	{
		Result=(Ambient + Diffuse + Specular);
		IsInSpotLight = false;
	}
	else
	{
		Result= Light.Ambient * vec3(texture(diffuseTexture, fTexCoords));
		IsInSpotLight = true;
	}

	return Result;
}



float computeShadow()
{

	//perform perspective divide
	vec3 normalizedCoords= fragPosLightSpace.xyz / fragPosLightSpace.w;

	//tranform from [-1,1] range to [0,1] range
	normalizedCoords = normalizedCoords * 0.5 + 0.5;

	//get closest depth value from lights perspective
	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;

	//get depth of current fragment from lights perspective
	float currentDepth = normalizedCoords.z;

	//if the current fragments depth is greater than the value in the depth map, the current fragment is in shadow 
	//else it is illuminated
	//float shadow = currentDepth > closestDepth ? 1.0 : 0.0;
	float bias = 0.005f;
	float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
	if (normalizedCoords.z > 1.0f)
		return 0.0f;
	return shadow;
	
}

void computeLightComponents()
{		
	vec3 cameraPosEye = vec3(0.0f);//in eye coordinates, the viewer is situated at the origin
	
	//transform normal
	vec3 normalEye = normalize(fNormal);	
	
	//compute light direction
	vec3 lightDirN = normalize(lightDir);
	
	//compute view direction 
	vec3 viewDirN = normalize(cameraPosEye - fPosEye.xyz);
		
	//compute ambient light
	ambient = ambientStrength * lightColor;
	
	//compute diffuse light
	diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;

	//compute specular light
	vec3 reflection = reflect(-lightDirN, normalEye);
	float specCoeff = pow(max(dot(viewDirN, reflection), 0.0f), shininess);
	specular = specularStrength * specCoeff * lightColor;
}

float getFogFactor()
{
	if(!FogEnabled)
	{
		return 0;
	}
	
	vec4 V = fVertPos;
    float d = distance(fPosEye, V);

    const float FogMax = 27.0;
    const float FogMin = 15.0;

    if (d>=FogMax) return 1;
    if (d<=FogMin) return 0;

    return 1 - (FogMax - d) / (FogMax - FogMin);
}


void main() 
{
	computeLightComponents();
	vec3 raveColor = vec3(1.f, 1.f, 1.f);

	vec3 viewDirection = normalize(-fFragPos);
	bool IsInSpotLight = false;
	vec3 spotLight = CalcSpotLight(USpotLight, fNormal, viewDirection, IsInSpotLight);

	ambient *= texture(diffuseTexture, fTexCoords).rgb;
	diffuse *= texture(diffuseTexture, fTexCoords).rgb;
	specular *= texture(specularTexture, fTexCoords).rgb;

	float shadow = computeShadow();

	vec3 color = min((ambient + (1.0f - shadow) * diffuse) + (1.0f - shadow) * specular, 1.0f);
	color *= vec3(0.5f, 0.5f, 0.5f);
	color += spotLight;
    color *= raveColor;

    float alpha = getFogFactor();

	vec4 fogColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);

	fColor = mix(vec4(color, 1.0f), fogColor, alpha);
}
