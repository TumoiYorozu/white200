
const shuffle = ([...array]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function ColorToHex(color) {
    var hexadecimal = color.toString(16);
    return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
}
function ConvertRGBtoHex(col) {
    return ColorToHex(col[0]) + ColorToHex(col[1]) + ColorToHex(col[2]);
}

let ac_color = [-1, -1, -1];
let ac_color_hex = "";
let color_step = 0;
let start_time;
let try_num   = 0;
let score_num = 0;
let enable_submit = 0;

function update_score(){
    const try_elem = document.getElementById('try');
    try_elem.innerHTML = "Try: " + try_num;

    const score_elem = document.getElementById('score');
    score_elem.innerHTML = "Score: " + score_num;
}

function submit(r, g, b) {
    if (!enable_submit) return;

    const col = [r, g, b];
    const col_hex = ConvertRGBtoHex(col);
    try_num++;

    if (col_hex == ac_color_hex) {
        time = update_timer();
        enable_submit = false;
        update_score();
        document.getElementById('modal_ac').style.visibility ="visible";
        
        const time_text = Math.floor(time/1000) + "." + ("00"+time%1000).slice(-3);
        document.getElementById('ac_scores').innerHTML = 
            "Score: " + score_num + "<br>" +
            "Time: " + time_text + "<br>" +
            "Try: " + try_num;

        let comment = "";
        let comment2 = "";
        if (color_step != 1) {
            comment = "| チュートリアルを完了しました！"
            comment2 = "チュートリアル終了！"
        } else if(try_num == 1) {
            comment = "| 一発で白を見つけられました！"
            comment2 = "一発で白を見つけられた！"
        } else if(time <= 10000) {
            comment = "| 素早くで白を見つけられました！"
            comment2 = "素早く白を見つけられた！"
        } else if(try_num <= 10) {
            comment = "| 10回以内に白を見つけられました！"
            comment2 = "10回以内に見つけられた！"
        }

        document.getElementById('tw_share').setAttribute('href',
            "http://twitter.com/share?url=" + encodeURI(location.href) +
            "&hashtags=white_200&related=TumoiYorozu" +
            "&text="+encodeURI("200色の白から見つけよう！ White 200 "+comment+"\n得点:" + score_num + " 時間:" + time_text + "秒 クリック回数:" + try_num)
        );
        
        document.getElementById('ac_comment').innerHTML = comment2;

    } else {
        const dif = ((ac_color[0]-r)**2 + (ac_color[1]-g)**2 + (ac_color[2]-b)**2) / color_step**2;
        score_num -= dif;
        update_score();

        const hazure = document.getElementById('modal_hazure');
        hazure.classList.remove("hazure_anim")
        window.requestAnimationFrame(function(time) {
            window.requestAnimationFrame(function(time) {
                hazure.classList.add("hazure_anim")
                hazure.addEventListener('animationend', function() {
                    hazure.classList.remove("hazure_anim")
                });
            });
        });
        const hazure_text = document.getElementById('hazure_text');
        hazure_text.innerHTML="#" + col_hex + "<br>はずれ (-" + dif + ")";
    }
}
function update_timer(){
    if (!enable_submit) return;

    let now_time = new Date();
    let diff = now_time.getTime() - start_time.getTime();

    const time_elem = document.getElementById('time');
    time_elem.innerHTML = "Time<br>" + 
        Math.floor(diff/1000) + "." + 
        ("0"+Math.floor(diff/10)%100).slice(-2);
    setTimeout(update_timer, 30);
    return diff;
}

function make_problem(num, dif){
    const start_btn = document.getElementById('start_btn');
    if (start_btn != null) start_btn.remove();

    color_step = dif;
    const alt = document.getElementById('list');
    const target_col = [255, 255, 255];
    alt.innerHTML="";
    let list = [];
    for(let r = 0; r <= 5; ++r){
        for(let g = 0; g <= 5; ++g){
            for(let b = 0; b <= 5; ++b){
                list.push([target_col[0]-r*dif, target_col[1]-g*dif, target_col[2]-b*dif]);
            }
        }
    }
    list = shuffle(list);
    let html = "";
    for(let i = 0; i < num; ++i) {
        let col_hex = ConvertRGBtoHex(list[i]);
        html += '<div'+
            ' class="alternatives"'+
            ' id=col_' + col_hex +
            ' onclick=submit(' + list[i][0]+","+list[i][1]+","+list[i][2] + ')'+
            ' style="background-color:#'+ col_hex +
            '"></div>\n';
            // '">#' + col_hex + '</div>\n';
    }
    alt.innerHTML=html;
    ac_color = list[Math.floor(Math.random() * num)];
    ac_color_hex = ConvertRGBtoHex(ac_color);
    const problem_text = document.getElementById('problem_text');
    problem_text.innerHTML = "この白を探せ！<br>#" + ac_color_hex;
    const problem_color_box = document.getElementById('problem_color_box');
    problem_color_box.style.setProperty('background-color', "#" + ac_color_hex);

    
    document.getElementById('modal_ac').style.visibility ="hidden";

    score_num = (dif == 1) ? 1000 : 100;
    try_num = 0;
    update_score();

    start_time = new Date();
    enable_submit = true;
    update_timer();
}

window.onload = function(){
    // make_problem(200, 2);
    // make_problem(3, 2);
}
