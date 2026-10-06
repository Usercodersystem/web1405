var cmd = process.argv[2];
var num1 = parseInt(process.argv[3]);
var num2 = parseInt(process.argv[4]);
switch(cmd)
{
    case "sum":
        console.log("Result is : " , num1+num2);
        break;
    case "minus":
        console.log("Result is : " , num1-num2);
        break;
    default:
        console.log("Err action not found");
}
