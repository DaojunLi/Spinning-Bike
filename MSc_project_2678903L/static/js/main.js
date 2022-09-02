// Global variables here to be used in game
var lvlselected = 0;
var noBikes = 1;
var modeSelected = 0;
var inGame = false;
var curBulbs = 0;
var bike1pwr = 0;
var bike2pwr = 0;
var timeExp;
var bulbPhase = 0;
var ledBulbs = 0;
var filBulbs = 0;
var bulbDivisor = 6;
var compCurBulbs = [0, 0];
var compLedBulbs = [0, 0];
var compFilBulbs = [0, 0];
let width = screen.width;
let height = screen.height;
var imgWidth = 0.07 * width;
var imgHeightPerc = imgWidth / 142;
var imgHeight = 0;
var total_power = 0;
var comp_total_power = [0, 0];

document.addEventListener('fullscreenchange', function () {
    console.info("full screen change");

    if (document.fullscreenElement) {

        document.getElementById("menuBar").style.display = "none";

    } else {

        document.getElementById("menuBar").style.display = "block";

    }
});
document.onfullscreenchange = fullscreenchanged;
//Class for the bikes
class BLEDevice {

    device;

    async deviceDetails(BikeNo) {

        await navigator.bluetooth.requestDevice({
            /*acceptAllDevices: true*/
            filters: [{ services: ['00001818-0000-1000-8000-00805f9b34fb'] }], optionalServices: ['battery_service']
        })
            .then(device => {
                this.device = device;
                this.device.addEventListener('gattserverdisconnected', function () {

                    setTimeout(function () {

                        reconnectBike(BikeNo);
                    }, 2000);

                });
                this.startConnection(BikeNo);
            })
    }

    async startConnection(BikeNo) {

        console.info(device);
        await this.device.gatt.connect()
            .then(reserver => {
                console.info(reserver);
                console.info("getting service");
                return reserver.getPrimaryService('00001818-0000-1000-8000-00805f9b34fb');
            }).then(service => {
                // Getting Characteristic…
                console.info(service)
                return service.getCharacteristic('00002a63-0000-1000-8000-00805f9b34fb');
            }).then(characteristic => characteristic.startNotifications())
            .then(characteristic => {
                // Set up event listener for when characteristic value changes.
                console.info("setting up listener")

                characteristic.addEventListener('characteristicvaluechanged',
                    function () {
                        testchange(event, BikeNo);
                    });

                // Reading value
                console.info("Reading value")
                //return characteristic.readValue();
            }).catch(error => { console.error(error); });
        console.info("Done");

    }

    async disConnectDevice() {



        await this.device.gatt.disconnect();
    }

    connectionDetails() {



        if (typeof (this.device) === "undefined") {

            return false;

        } else {

            return this.device.gatt.connected;

        }



    }

}

//Global variables to store details for both bikes as objects
const device = new BLEDevice();
const device2 = new BLEDevice();

// Code for connection buttons goes here
async function connectBike(BikeNo) {

    if (BikeNo == 1) {

        await device.deviceDetails(BikeNo);
        console.info(typeof device)
        //console.info(device);
        console.info(device.connectionDetails());

    } else {

        await device2.deviceDetails(BikeNo);
        console.info(typeof device2)
        //console.info(device);
        console.info(device2.connectionDetails());

    }

    if (!document.getElementById("reconnectBike" + BikeNo.toString())) {

        let btn = document.createElement("button");
        btn.innerHTML = "Reconect Bike " + BikeNo.toString();
        btn.type = "submit";
        btn.name = "formBtn";
        btn.id = "reconnectBike" + BikeNo.toString();
        if (BikeNo == 1) {

            btn.onclick = function () {

                device.startConnection(1);

            };
        } else {


            btn.onclick = function () {

                device2.startConnection(2);

            };

        };
        document.getElementById("ReconnectArea").appendChild(btn);

    };

}

async function reconnectBike(bikeNo) {

    console.info("attemptin reconnect");

    if (bikeNo == 1) {
        console.info("attempting bike 1 reconnect");
        await device.startConnection(bikeNo);

        if (!device.connectionDetails()) {
            console.info("failed connection");
            setTimeout(function () {

                reconnectBike(bikeNo);
            }, 5000);

        }

    } else {

        device2.startConnection(bikeNo);

        if (!device2.connectionDetails()) {

            setTimeout(function () {

                reconnectBike(bikeNo);
            }, 5000);

        }

    }

}


async function testConnectBtn() {
    console.info("D1");
    console.info(device.connectionDetails());
    console.info("D2");
    console.info(device2.connectionDetails());
}


async function btnDisconnect(BikeNo) {

    if (BikeNo == 1) {

        await device.disConnectDevice();

        console.info("disconnected bike 1");

    } else {

        await device2.disConnectDevice();

        console.info("disconnected bike 2");

    };

}



function fullscreenchanged(event) {

    console.info("full screen change");

    if (document.fullscreenElement) {

        document.getElementById("menuBar").style.display = "none";

    } else {

        document.getElementById("menuBar").style.display = "block";

    }
}

function hideMenu() {
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem = window.top.document.body; //To break out of frame in IE
        elem.msRequestFullscreen();
    }
    splashScreen();

}


var testpower = 0;
var t = setInterval(() => {
    if (inGame) {
        testpower++;
        testchange(testpower, 1);
        testchange(testpower, 2);
    }
}, 500)



//Event handler for recieving gatt notifications and running of games
function testchange(event, bikeNo) {
    console.info("pwr event")
    //const testvalue = event.target.value.getUint8(0);

    //power = event.target.value.getUint8(2, true);
    //用于测试
    power = event

    console.info('Power is ' + power);
    if (bikeNo == 1) {

        bike1pwr = power;

    } else {

        bike2pwr = power;

    };

    if (inGame) {

        //mode sected value of 1 indicates bulbs
        if (lvlselected == 1) {

            if (modeSelected == 0) {

                soloCoopBulb(power);

            } else if (modeSelected == 1) {

                soloCoopBulb(bike2pwr + bike1pwr);

            } else if (modeSelected == 2) {

                compBulb(bikeNo, power);

            } else if (modeSelected == 3) {

                coopetBulb(bikeNo, power);

            };

            //Level selected value of 2 is toaster game
        } else if (lvlselected == 2) {

            if (modeSelected == 0) {

                soloCoopToaster(power);

            } else if (modeSelected == 1) {

                soloCoopToaster(bike2pwr + bike1pwr);

            } else if (modeSelected == 2) {

                compToaster(bikeNo, power);

            } else if (modeSelected == 3) {

                coopetToaster(bikeNo, power);

            };

        } else if (lvlselected == 3) {

            if (modeSelected == 0) {

                soloCoopKettle(power);

            } else if (modeSelected == 1) {

                soloCoopKettle(bike2pwr + bike1pwr);

            } else if (modeSelected == 2) {

                compKettle(bikeNo, power);

            } else if (modeSelected == 3) {

                coopetKettle(bikeNo, power);

            };

        }



    }
}

//Bulb games
// solo 需求1
function soloCoopBulb(power) {
    document.getElementById("timer").style.display = "block";


    total_power += power;
    bulbs = Math.ceil(power / bulbDivisor);

    if (bulbPhase == 0) {

        srcImg = "{% static 'images/LED.PNG'%}";

        if (ledBulbs < bulbs) { ledBulbs = bulbs; }

    } else {

        srcImg = "{% static 'images/Filament.PNG'%}";

        if (filBulbs < bulbs) { filBulbs = bulbs; }

    };

    if (curBulbs < bulbs) {


        for (i = curBulbs; i < bulbs; i++) {

            let newLed = document.createElement("img");
            newLed.id = i.toString() + "led";
            console.info(newLed.id);
            newLed.src = srcImg;
            document.getElementById("solo").appendChild(newLed);

        }

        curBulbs = bulbs;

    } else if (curBulbs > bulbs) {

        var delBulbs = curBulbs - bulbs;

        for (i = 1; i <= delBulbs; i++) {
            console.info((curBulbs - i).toString() + "led");
            document.getElementById((curBulbs - i).toString() + "led").remove();


        }

        curBulbs = bulbs;

    };


}

function compBulb(bikeNo, power) {

    bulbs = Math.ceil(power / bulbDivisor);
    console.log(bulbs, power);
    var blankImg = "{% static 'images/blank.png'%}";
    comp_total_power[bikeNo - 1] += power;

    if (bulbPhase == 0) {

        srcImg = "{% static 'images/LED.PNG'%}";

        if (compLedBulbs[bikeNo - 1] < bulbs) { compLedBulbs[bikeNo - 1] = bulbs; }
        imgHeight = imgHeightPerc * 241;


    } else {

        srcImg = "{% static 'images/Filament.PNG'%}";

        if (compFilBulbs[bikeNo - 1] < bulbs) { compFilBulbs[bikeNo - 1] = bulbs; }
        imgHeight = imgHeightPerc * 192;

    };

    if (bikeNo == 1) {
        document.getElementById("bulbvsTable").getElementsByClassName('bulb1')[0].innerHTML = '<img id="' + i.toString() + 'led" src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '"  /><h1>x' + bulbs + '</h1>';
        changeBar(power, 10, 30, 'px', 'ProgressBarsBike1');
    }
    if (bikeNo == 2) {
        document.getElementById("bulbvsTable").getElementsByClassName('bulb2')[0].innerHTML = '<img id="' + i.toString() + 'led" src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '"  /><h1>x' + bulbs + '</h1>';
        changeBar(power, 10, 30, 'px', 'ProgressBarsBike2');
    }

    function changeBar(gridNum, gridWidth, height, unit, id) {
        let el = document.getElementById(id);
        el.style.borderRadius = height + unit;
        el.style.height = height + unit;
        let width = gridNum * gridWidth;
        el.style.width = height + width + unit;
        el.innerText = '' + gridNum + 'W';
    }




    /* if (bulbs <= 5) {

        //Add more bulbs to bike 1 if less than 5 bulbs powering
        if (compCurBulbs[bikeNo - 1] < bulbs && bikeNo == 1) {


            for (i = 0; i < bulbs; i++) {
                console.info("adding bulb " + i.toString());
                document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img id="' + i.toString() + 'led" src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '"  />';

            }

            compCurBulbs[bikeNo - 1] = bulbs;

            //If no of bulbs being powered less than current bulbs remove unpowered bulbs
        } else if (compCurBulbs[bikeNo - 1] > bulbs && bikeNo == 1) {

            var delBulbs = compCurBulbs[bikeNo - 1] - bulbs;

            for (i = 1; i <= delBulbs; i++) {
                console.info((compCurBulbs[bikeNo - 1] - i).toString() + "led");
                document.getElementById((compCurBulbs[bikeNo - 1] - i).toString() + "led").remove();


            }

            compCurBulbs[bikeNo - 1] = bulbs;

            //If bike 2 needs more bulbs powered add them
        } else if (compCurBulbs[bikeNo - 1] < bulbs && bikeNo == 2) {


            for (i = 10; i > 10 - bulbs; i--) {
                console.info("adding bulb " + i.toString());
                document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img id="' + (i).toString() + 'led" src=' + srcImg + ' alt="led"  width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';

            }

            compCurBulbs[bikeNo - 1] = bulbs;

        } else if (compCurBulbs[bikeNo - 1] > bulbs && bikeNo == 2) {

            for (i = 11 - compCurBulbs[bikeNo - 1]; i < 11 - bulbs; i++) {
                console.info((i).toString() + "led");
                document.getElementById((i).toString() + "led").remove();


            }

            compCurBulbs[bikeNo - 1] = bulbs;

        };
        //如果大于5则显示x几
    } else if (bulbs > 5 && bikeNo == 1) {


        if (compCurBulbs[bikeNo - 1] > 5) {

            document.getElementById("bulbvsTable").rows[1].cells[3].innerHTML = "<h2>X" + bulbs + "</h2>";
            compCurBulbs[bikeNo - 1] = bulbs;
            console.log("change bulbs"+bulbs);

        } else if (compCurBulbs[bikeNo - 1] <= 5) {

            for (i = 0; i <= compCurBulbs[bikeNo - 1]; i++) {
                console.info("deleteing: " + (compCurBulbs[bikeNo - 1]).toString() + "led");
                document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img src=' + blankImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';

            }

            document.getElementById("bulbvsTable").rows[1].cells[2].innerHTML = '<img id="1led" src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';
            document.getElementById("bulbvsTable").rows[1].cells[3].innerHTML = "<h2>X" + bulbs + "</h2>";
            compCurBulbs[bikeNo - 1] = bulbs;

        }

    } else if (bulbs > 5 && bikeNo == 2) {

        if (compCurBulbs[bikeNo - 1] > 5) {

            document.getElementById("bulbvsTable").rows[1].cells[10].innerHTML = "<h2>X" + bulbs + "</h2>";
            compCurBulbs[bikeNo - 1] = bulbs;

        } else if (compCurBulbs[bikeNo - 1] <= 5) {

            for (i = 0; i <= compCurBulbs[bikeNo - 1]; i++) {
                console.info("deleteing: " + (compCurBulbs[bikeNo - 1] + 6).toString() + "led");
                document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img src=' + blankImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';

            }

            document.getElementById("bulbvsTable").rows[1].cells[7].innerHTML = '<img id="6led" src=' + srcImg + ' alt="led"  width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '"/>';
            document.getElementById("bulbvsTable").rows[1].cells[8].innerHTML = "<h2>X" + bulbs + "</h2>";
            compCurBulbs[bikeNo - 1] = bulbs;

        }

    } */


}
// Code for games menu goes here

function splashScreen() {

    document.getElementById("splashScreenArea").style.display = "block";
    document.getElementById("splashScreenImg").width = width;
    document.getElementById("splashScreenImg").height = height;
    document.getElementById("div test").style.display = "none";
    document.getElementById("bikeInstr").style.display = "none";

}

function start() {

    document.getElementById("splashScreenArea").style.display = "none";
    document.getElementById("bikeInstr").style.display = "none";

    document.getElementById("div test").style.display = "block";

    const tables = document.getElementsByClassName("Btn_table");

    for (let i = 0; i < tables.length; i++) {

        console.info("showing table");
        tables[i].style.display = "block";

    };

    document.getElementById("Btn1").style.display = "none";
    document.getElementById("Btn2").style.display = "none";
    document.getElementById("Btn3").style.display = "none";
    //document.getElementById("Btn1").innerHTML = "1";
    //document.getElementById("Btn2").innerHTML = "2";

}


//第二个界面 ： 选择游戏模式 灯泡 洗衣机...
function selectBikes(inLvl) {
    document.getElementById("P1").style.display = "none";
    const tables = document.getElementsByClassName("Btn_table");
    console.info("test here");
    for (let i = 0; i < tables.length; i++) {

        console.info("removing table");
        tables[i].style.display = "none";

    };
    lvlselected = inLvl;

    document.getElementById("instrTitle").style.display = "block";
    document.getElementById("bikeInstr").style.display = "none";
    //document.getElementById("instrTitle").innerHTML = "Select Number of Bikes";
    document.getElementById("Btn1").style.display = "inline";
    document.getElementById("Btn2").style.display = "inline";
    document.getElementById("Btn3").style.display = "inline";
    document.getElementById("Btn1").classList.add("bikeBtn");
    document.getElementById("Btn2").classList.add("bikeBtn");

    //document.getElementById("Btn1").innerHTML = "1";
    //document.getElementById("Btn2").innerHTML = "2";

    document.getElementById("Btn1").onclick = function () {
        noBikes = 1;
        modeSelected = 0;
        console.info("Selected bikes: 1");
        bikeSetup();

    };
    document.getElementById("Btn2").onclick = function () {
        noBikes = 1;
        console.info("Selected bikes: 1");
        bikeSetup();
    };
    document.getElementById("Btn2").onclick = function () {
        noBikes = 2;
        console.info("Selected bikes: 2");
        selectMode();
    };
};

function bikeSetup() {
    document.getElementById("instrTitle").style.display = "none";
    document.getElementById("div test").style.display = "none";
    document.getElementById("bikeInstr").style.display = "block";
}

function selectMode() {

    for (i = 1; i < 4; i++) {

        btnId = "Btn" + i.toString();
        console.info(btnId);
        document.getElementById(btnId).style.display = "inline";

    }

    document.getElementById("Btn1").classList.remove("bikeBtn");
    document.getElementById("Btn2").classList.remove("bikeBtn");
    document.getElementById("instrTitle").innerHTML = "Select Game Mode";
    document.getElementById("Btn1").innerHTML = "Co-operative";
    document.getElementById("Btn2").innerHTML = "Competitive";
    document.getElementById("Btn3").innerHTML = "Co-opetition - Same goals but competitive";
    document.getElementById("bikeInstr").style.display = "none";
    document.getElementById("bikeInstr").style.display = "none";

    document.getElementById("Btn1").onclick = function () {
        modeSelected = 1;

        console.info("Selected: co-op");
        //dispInstructions();

        bikeSetup();

    };
    document.getElementById("Btn2").onclick = function () {
        modeSelected = 2;

        console.info("Selected: comp");

        bikeSetup();
    };
    document.getElementById("Btn3").onclick = function () {
        modeSelected = 3;

        console.info("Selected: co-opetition");
    };
}



function startGame() {

    console.info("start game called");
    //document.getElementById("instrTitle").style.display = "none";
    document.getElementById("bikeInstr").style.display = "none";

    // if (noBikes == 2 && (!device.connectionDetails() || !device2.connectionDetails())) {

    //     if (!device.connectionDetails() || !device2.connectionDetails()) {
    //         console.info("disp instr 2 bikes")
    //         dispInstructions();

    //     }

    // } else if (!device.connectionDetails()) {
    //     console.info("dispinstr 1 bike");
    //     dispInstructions();

    // } else {
    {
        console.info("game started");
        document.getElementById("div test").style.display = "none";
        document.getElementById("divInstr").style.display = "none";

        total_power = 0;

        if (lvlselected == 1) {
            //整个游戏面板
            document.getElementById("bulbs").style.display = "block";
            //记时
            document.getElementById("timer").style.display = "block";
            //提示
            document.getElementById("bulbDescription").style.display = "block";

            document.getElementById("bulbDescription").innerHTML = "How many LED bulbs can you power for 30 seconds?";

            document.getElementById("timer").innerHTML = "30s ";
            ledBulbs = 0;
            filBulbs = 0;
            bulbPhase = 0;
            bulbDivisor = 6;
            //时间期限
            timeExp = new Date(Date.now() + 30 * 1000);

            if (modeSelected == 2) {
                //显示灯泡表格
                document.getElementById("bulbvsTable").style.display = "block";

                var srcImg = "{% static 'images/blank.png'%}";
                imgHeight = imgHeightPerc * 241;

                // for (i = 0; i < 11; i++) {

                //     document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';
                

                // }

            };

            //Level selected value of 2 is toaster game
        } else if (lvlselected == 2) {

            //todo add toaster

        } else if (lvlselected == 3) {

            //todo add kettle

        }
        //开始游戏
        inGame = true;


    }




}

function dispInstructions() {

    document.getElementById("div test").style.display = "none";
    document.getElementById("divInstr").style.display = "block";
    document.getElementById("bikeInstr").style.display = "none";

    if (noBikes == 2) {

        if (!device.connectionDetails() || !device2.connectionDetails()) {

            setTimeout(dispInstructions, 5000);

        }

    } else if (!device.connectionDetails()) {

        setTimeout(dispInstructions, 5000);

    } else {

        //Will be called if correct bikes are connected
        startGame();

    }



}

// timer function
// 定时器，一秒执行一次方法
var x = setInterval(function () {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = timeExp - now;


    // Time calculations for minutes and seconds
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    //显示当前记时间
    // Display the result in the element with id="demo"
    try {
        document.getElementById("timer").innerHTML = seconds + "s ";
    } catch (e) {

    }
    //如果到时间了
    if (lvlselected == 1 && distance < 0) {
        console.log("buldTimer")
        bulbTimer(distance);

    }



}, 1000);

//时间到了
function bulbTimer(distance) {

    if (inGame && bulbPhase == 0) {
        try {
            document.getElementById("timer").style.display = "none";
        } catch (e) {

        }

        if (modeSelected <= 1) {
            soloBulbClear();
            document.getElementById("bulbDescription").innerHTML = "You managed to power " + ledBulbs + " LED bulbs, how many filament bulbs can you now power?";

        } else if (modeSelected == 2) {

            compBulbClear();

            if (compLedBulbs[0] > compLedBulbs[1]) {

                document.getElementById("bulbDescription").innerHTML = "Player 1 is winning! They managed to power " + compLedBulbs[0] + "LED Bulbs <br> Player 2 powered " + compLedBulbs[1] + "LED Bulbs";

            } else if (compLedBulbs[1] > compLedBulbs[0]) {

                document.getElementById("bulbDescription").innerHTML = "Player 1 is winning! They managed to power " + compLedBulbs[0] + "LED Bulbs <br> Player 2 powered " + compLedBulbs[1] + "LED Bulbs";

            } else {

                document.getElementById("bulbDescription").innerHTML = "It's neck and neck! You both powered:" + compLedBulbs + "LED bulbs";

            }
        }

        bulbPhase = 1;

        timeExp = new Date(Date.now() + 5 * 1000);
        inGame = false;

    } else if (bulbPhase == 1 && distance < 0) {

        timeExp = new Date(Date.now() + 30 * 1000);
        now = new Date().getTime();

        // Find the distance between now and the count down date
        distance = timeExp - now;

        // Time calculations for minutes and seconds
        minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element with id="demo"
        document.getElementById("timer").innerHTML = seconds + "s ";
        document.getElementById("timer").style.display = "block";
        document.getElementById("bulbDescription").innerHTML = "How many filament bulbs can you power for 30 seconds?";
        bulbPhase += 1;
        inGame = true;
        bulbDivisor = 40

    } else if (inGame && bulbPhase == 2 && distance < 0) {
        try {
            document.getElementById("timer").innerHTML = "Time Expired";
        } catch (e) {

        }

        if (modeSelected <= 1) {
            soloBulbClear();
            document.getElementById("bulbDescription").innerHTML = "You managed to power " + ledBulbs + " LED Bulbs and " + filBulbs + " filament Bulb. You generated a total of " + total_power + "W over the minute";

        } else if (modeSelected == 2) {

            compBulbClear();

            if (comp_total_power[0] > comp_total_power[1]) {

                document.getElementById("bulbDescription").innerHTML = "Player 1 wins generating  " + comp_total_power[0] + " W over the minute! <br> Player 1 powered " + compLedBulbs[0] + "LED Bulbs and " + compFilBulbs[0] + " filament Bulbs" + "<br> Player 2 powered " + compLedBulbs[1] + "LED Bulbs and " + compFilBulbs[1] + " filament Bulbs";

            } else if (comp_total_power[1] > comp_total_power[0]) {

                document.getElementById("bulbDescription").innerHTML = "Player 2 wins generating  " + comp_total_power[1] + " W over the minute! <br> Player 2 powered " + compLedBulbs[1] + "LED Bulbs and " + compFilBulbs[1] + " filament Bulbs" + "<br> Player 1 powered " + compLedBulbs[0] + "LED Bulbs and " + compFilBulbs[0] + " filament Bulbs";

            } else {

                document.getElementById("bulbDescription").innerHTML = "It's a draw! You each generated  " + comp_total_power[0] + " W over the minute! <br> Player 1 powered " + compLedBulbs[0] + "LED Bulbs and " + compFilBulbs[0] + " filament Bulbs" + "<br> Player 2 powered " + compLedBulbs[1] + "LED Bulbs and " + compFilBulbs[1] + " filament Bulbs";


            }


        }


        document.getElementById("timer").style.display = "none";
        document.getElementById("bulbvsTable").style.display = "none";
        document.getElementById("bulbFacts").style.display = "block";

        if (total_power > 100) {

            document.getElementById("bulbDescription2").style.display = "block";

        }
        bulbPhase = 3;
        inGame = false;
        timeExp = new Date(Date.now() + 20 * 1000);
    } else if (bulbPhase == 3 && distance < 0) {

        document.getElementById("timer").style.display = "none";
        document.getElementById("bulbFacts").style.display = "none";
        document.getElementById("bulbs").style.display = "none";
        document.getElementById("bulbDescription2").style.display = "none";
        document.getElementById("bulbDescription").style.display = "none";

        inGame = false;
        bulbPhase = 0;
        splashScreen();
    }

}

function soloBulbClear() {

    for (i = 0; i <= curBulbs; i++) {
        console.info(i.toString() + "led");
        try {
            document.getElementById(i.toString() + "led").remove();
        } catch (e) {

        }

    };

    curBulbs = 0;

}

function compBulbClear() {

    var srcImg = "{% static 'images/blank.png'%}";
    imgHeight = imgHeightPerc * 241;
    document.getElementById("bulbvsTable").getElementsByClassName('bulb1')[0].innerHTML = '<img src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';
    document.getElementById("bulbvsTable").getElementsByClassName('bulb2')[0].innerHTML = '<img src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';

    // for (i = 0; i < 11; i++) {

    //     document.getElementById("bulbvsTable").rows[1].cells[i].innerHTML = '<img src=' + srcImg + ' alt="led" width = "' + imgWidth.toString() + '" height ="' + imgHeight.toString() + '" />';


    // }

    compCurBulbs = [0, 0];

}