let controllers = [
    {
        name: "sum",
        func: function (input) {
            console.log(
                "sum is:",
                Number(input[0]) + Number(input[1])
            );
        }
    },
    {
        name: "minus",
        func: function (input) {
            console.log(
                "result is:",
                Number(input[0]) - Number(input[1])
            );
        }
    },
    {
        name: "print",
        func: function (input) {
            let x = {
                name: input[0],
                email: input[1],
                age: input[2]
            };

            console.log("object is:", x);
        }
    }
];

export default controllers;