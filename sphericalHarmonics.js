
function sphericalHarmonicsl0m0(x,y,z)
{
    return (1/2)*Math.sqrt(1/Math.PI);
}
function sphericalHarmonicsl1m0(x,y,z)
{
    return Math.sqrt(3/(4*Math.PI))*(y/Math.sqrt(x*x+y*y+z*z));
}
function sphericalHarmonicsl1m1(x,y,z)
{
    return Math.sqrt(3/(4*Math.PI))*(x/Math.sqrt(x*x+y*y+z*z));
}
function sphericalHarmonicsl1m_1(x,y,z)
{
    return Math.sqrt(3/(4*Math.PI))*(z/Math.sqrt(x*x+y*y+z*z));
}
function top_face(x,y,z)
{
    if(y<=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //y=1
        //1=b*t
        //t=1/b
        const intersection_x=x/y;
        const intersection_z=z/y;
        if(intersection_x<=1.0&&intersection_x>=-1.0&&intersection_z<=1.0&&intersection_z>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}
function bottom_face(x,y,z)
{
    if(y>=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //y=-1
        //-1=b*t
        //t=-1/b
        const intersection_x=-x/y;
        const intersection_z=-z/y;
        if(intersection_x<=1.0&&intersection_x>=-1.0&&intersection_z<=1.0&&intersection_z>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}
function right_face(x,y,z)
{
    if(x>=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //x=1
        //1=a*t
        //t=1/a
        const intersection_y=y/x;
        const intersection_z=z/x;
        if(intersection_y<=1.0&&intersection_y>=-1.0&&intersection_z<=1.0&&intersection_z>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}
function left_face(x,y,z)
{
    if(x<=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //x=-1
        //-1=a*t
        //t=-1/a
        const intersection_y=-y/x;
        const intersection_z=-z/x;
        if(intersection_y<=1.0&&intersection_y>=-1.0&&intersection_z<=1.0&&intersection_z>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}
function front_face(x,y,z)
{
    if(z>=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //z=1
        //1=c*t
        //t=1/c
        const intersection_x=x/z;
        const intersection_y=y/z;
        if(intersection_x<=1.0&&intersection_x>=-1.0&&intersection_y<=1.0&&intersection_y>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}

function back_face(x,y,z)
{
    if(z<=0.0)
    {
        return 0;
    }
    else{
        x=x/Math.sqrt(x*x+y*y+z*z);
        y=y/Math.sqrt(x*x+y*y+z*z);
        z=z/Math.sqrt(x*x+y*y+z*z);
        //x=a*t
        //y=b*t
        //z=c*t
        //z=-1
        //-1=c*t
        //t=-1/c
        const intersection_x=-x/z;
        const intersection_y=-y/z;
        if(intersection_x<=1.0&&intersection_x>=-1.0&&intersection_y<=1.0&&intersection_y>=-1.0)
        {
            return 1;
        }
        else
        {
            return 0
        }
    }
}
function monteCarlo(n,f1,shf)
{
    let output = 0;

    for(let i=0;i<n;i++)
    {
        let z=(Math.random()*2)-1;
        let phi=Math.random()*Math.PI*2;
        let x=Math.sqrt(1-z*z)*Math.cos(phi);
        let y=Math.sqrt(1-z*z)*Math.sin(phi);
        output+= f1(x,y,z)*shf(x,y,z);
        
    }
    
    
    return (4*Math.PI/(n))*output;
}

function SH_coefficients_top_face(n)
{
    return [
       
        monteCarlo(n,top_face,sphericalHarmonicsl0m0),
        monteCarlo(n,top_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,top_face,sphericalHarmonicsl1m0),
        monteCarlo(n,top_face,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_bottom_face(n)
{
    return [
       
        monteCarlo(n,bottom_face,sphericalHarmonicsl0m0),
        monteCarlo(n,bottom_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,bottom_face,sphericalHarmonicsl1m0),
        monteCarlo(n,bottom_face,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_right_face(n)
{
    return [
       
        monteCarlo(n,right_face,sphericalHarmonicsl0m0),
        monteCarlo(n,right_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,right_face,sphericalHarmonicsl1m0),
        monteCarlo(n,right_face,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_left_face(n)
{
    return [
       
        monteCarlo(n,left_face,sphericalHarmonicsl0m0),
        monteCarlo(n,left_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,left_face,sphericalHarmonicsl1m0),
        monteCarlo(n,left_face,sphericalHarmonicsl1m1)
    ];
}

function SH_coefficients_front_face(n)
{
    return [
       
        monteCarlo(n,front_face,sphericalHarmonicsl0m0),
        monteCarlo(n,front_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,front_face,sphericalHarmonicsl1m0),
        monteCarlo(n,front_face,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_back_face(n)
{
    return [
       
        monteCarlo(n,back_face,sphericalHarmonicsl0m0),
        monteCarlo(n,back_face,sphericalHarmonicsl1m_1),
        monteCarlo(n,back_face,sphericalHarmonicsl1m0),
        monteCarlo(n,back_face,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_front_cosine_weinghted(n)
{    
    function front_hemisphere(x,y,z){
        return x*0+y*0+z*1;
    }
    return [
        monteCarlo(n,front_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,front_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,front_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,front_hemisphere,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_back_cosine_weinghted(n)
{    
    function back_hemisphere(x,y,z){
        return x*0+y*0-z*1;
    }
    return [
        monteCarlo(n,back_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,back_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,back_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,back_hemisphere,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_up_cosine_weinghted(n)
{    
    function up_hemisphere(x,y,z){
        return x*0+y*1+z*0;
    }
    return [
        monteCarlo(n,up_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,up_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,up_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,up_hemisphere,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_down_cosine_weinghted(n)
{    
    function down_hemisphere(x,y,z){
        return x*0-y*1+z*0;
    }
    return [
        monteCarlo(n,down_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,down_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,down_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,down_hemisphere,sphericalHarmonicsl1m1)
    ];
}

function SH_coefficients_right_cosine_weinghted(n)
{    
    function right_hemisphere(x,y,z){
        return x*1+y*0+z*0;
    }
    return [
        monteCarlo(n,right_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,right_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,right_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,right_hemisphere,sphericalHarmonicsl1m1)
    ];
}
function SH_coefficients_left_cosine_weinghted(n)
{    
    function left_hemisphere(x,y,z){
        return -x*1-y*0+z*0;
    }
    return [
        monteCarlo(n,left_hemisphere,sphericalHarmonicsl0m0),
        monteCarlo(n,left_hemisphere,sphericalHarmonicsl1m_1),
        monteCarlo(n,left_hemisphere,sphericalHarmonicsl1m0),
        monteCarlo(n,left_hemisphere,sphericalHarmonicsl1m1)
    ];
}

function precompute_sh_cosineWeight(n)
{
    const up_face = SH_coefficients_up_cosine_weinghted(n);
    const down_face = SH_coefficients_down_cosine_weinghted(n);
    const left_face = SH_coefficients_left_cosine_weinghted(n);
    const right_face = SH_coefficients_right_cosine_weinghted(n);
    const front_face = SH_coefficients_front_cosine_weinghted(n);
    const back_face = SH_coefficients_back_cosine_weinghted(n);

    return {
        up_face,
        down_face,
        left_face,
        right_face,
        front_face,
        back_face
    };
}
function precompute_sh_face(n)
{
    const up_face = SH_coefficients_back_face(n);
    const down_face = SH_coefficients_down_face(n);
    const left_face = SH_coefficients_left_face(n);
    const right_face = SH_coefficients_right_face(n);
    const front_face = SH_coefficients_front_face(n);
    const back_face = SH_coefficients_back_face(n);

    return {
        up_face,
        down_face,
        left_face,
        right_face,
        front_face,
        back_face
    };
}