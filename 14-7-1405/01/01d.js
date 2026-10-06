var cmd = process.argv[2];
var num1 = parseInt(process.argv[3]);
var num2 = parseInt(process.argv[4]);
function sum_num(num1,num2)
{
    return num1+num2;
}
function minus_num(num1,num2)
{
    return num1-num2;
}
switch(cmd)
{
    case "sum":
        console.log("Result is : " , sum_num(num1,num2));
        break;
    case "minus":
        console.log("Result is : " , minus_num(num1,num2));
        break;
    default:
        console.log("Err action not found");
}
