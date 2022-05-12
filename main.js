/**
 * shuffles given array non-destructively
 * @template T
 * @param {T[]} param0 array to shuffle; not to be mutated
 * @returns {T[]} shuffled array
 */
const shuffle = ([...array]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class Color {
    /**
     * converts number to 2-digit hex. if number is less than 0 or greater than 255, uses mod 256
     * @param {number} n number to convert to hex
     * @returns {string} 2-digit hex
     */
    static paddedHex(n) {
        return (n % 0x100).toString(16).padStart(2, '0');
    }

    /**
     * creates new color from the hex code; if hex is not valid, returns null
     * @param {`#${string}`} hex hex color code starting with #
     * @returns {Color?}
     */
    static fromHex(hex) {
        const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        if (!match) return null;

        return new Color({
            r: parseInt(match[1], 16),
            g: parseInt(match[2], 16),
            b: parseInt(match[3], 16),
        });
    }

    /**
     * @param {Record<'r'|'g'|'b', number>} param0 object with r, g, b numbers
     */
    constructor({ r, g, b }) {
        this.r = r % 0x100;
        this.g = g % 0x100;
        this.b = b % 0x100;
    }

    toString() {
        return this.toHex();
    }

    /**
     * @returns {string} hex color code starting with #
     */
    toHex() {
        return `#${Color.paddedHex(this.r)}${Color.paddedHex(this.g)}${Color.paddedHex(this.b)}`;
    }

    /**
     * compares this and other color for equality
     * @param {Color?} other color to compare to
     * @returns {boolean} true if colors are equal
     */
    eq(other) {
        return !!other && this.r === other.r && this.g === other.g && this.b === other.b;
    }

    /**
     * compares this and other color and calculates distance between them
     * (-1 if other color is null)
     * @param {Color?} other 
     * @returns {number} squared distance between this and other color
     */
    diff(other) {
        return other ? Math.pow(this.r - other.r, 2) + Math.pow(this.g - other.g, 2) + Math.pow(this.b - other.b, 2) : -1;
    }

    /**
     * creates new color with given difference from this color
     * @param {Record<'r'|'g'|'b', number>} param0 object with r, g, b diffs
     * @returns {Color} new color
     */
    withDiff({ r, g, b }) {
        return new Color({
            r: this.r + r,
            g: this.g + g,
            b: this.b + b,
        });
    }
}

const state = {
    /**
     * color to be guessed. if null, the game is not initiated
     * @type {Color?}
     */
    acColor: null,

    /**
     * try counts in this game
     * @type {number}
     */
    tryCount: 0,

    /**
     * score in this game
     * @type {number}
     */
    score: 0,

    /**
     * true if game is under processing submission; the game should be locked when true
     * @type {boolean}
     */
    readyForSubmission: false,

    /**
     * the started time of current game; if null, the game is not started
     * @type {Date?}
     */
    startTime: null,

    /**
     * @type {number}
     */
    colorStep: 0,
}

let enable_submit = 0;

/**
 * reflects score state to the UI
 */
function updateScore(){
    const tryEl = /** @type {HTMLParagraphElement} */ (document.getElementById('try'));
    tryEl.innerText = `Try: ${state.tryCount}`;

    const scoreEl = /** @type {HTMLParagraphElement} */ (document.getElementById('score'));
    scoreEl.innerText = `Score: ${state.score}`;
}

/**
 * submit and tries to guess the color
 * @param {`#${string}`} hex hex color code starting with #
 * @returns 
 */
function submit(hex) {
    if (!state.readyForSubmission) return;

    const color = Color.fromHex(hex);
    if (!color) return;
    
    state.tryCount++;

    if (color.eq(state.acColor)) {
        const time = updateTimer();
        state.readyForSubmission = false;
        updateScore();
        const modalElement = /** @type {HTMLDivElement} */ (document.getElementById('modal_ac'));
        modalElement.style.visibility ="visible";
        
        const scoresElement = /** @type {HTMLDivElement} */ (document.getElementById('ac_scores'));
        scoresElement.innerHTML = `\
Score: ${state.score}<br>
Time: ${time.toFixed(3)}<br>
Try: ${state.tryCount}<br>`

        const [comment1, comment2] = state.colorStep !== 1 ? [
            "| チュートリアルを完了しました！",
            "チュートリアル終了！",
        ] : state.tryCount === 1 ? [
            "| 一発で白を見つけられました！",
            "一発で白を見つけられた！",
        ] : time <= 10000 ? [
            "| 素早くで白を見つけられました！",
            "素早く白を見つけられた！",
        ] : ["", ""];

        const shareElement = /** @type {HTMLAnchorElement} */ (document.getElementById('tw_share'));
        shareElement.setAttribute('href',
            `http://twitter.com/share?url=${encodeURI(location.href)}&hashtags=white_200&related=TumoiYorozu&text=${
                encodeURI(`200色の白から見つけよう！ White 200 ${comment1}\n得点:${state.score} 時間:${time.toFixed(3)}秒 クリック回数:${state.tryCount}`)
            }`
        );

        const commentElement = /** @type {HTMLParagraphElement} */ (document.getElementById('ac_comment'));
        commentElement.innerText = comment2;

    } else {
        const diff = color.diff(state.acColor) / state.colorStep**2;
        state.score -= diff;
        updateScore();

        const modalElement = /** @type {HTMLDivElement} */ (document.getElementById('modal_hazure'));
        modalElement.classList.add("hazure_anim")
        modalElement.addEventListener('animationend', () => {
            modalElement.classList.remove("hazure_anim")
        });
        const textElement = /** @type {HTMLParagraphElement} */ (document.getElementById('hazure_text'));
        textElement.innerHTML=`#${color}<br>はずれ (-${diff})`;
    }
}

/**
 * updates the timer and returns elapsed time
 * (-1 if `state.isSubmitting` or the game is not started)
 * @returns {number} elapsed time in milliseconds
 */
function updateTimer(){
    if (!state.readyForSubmission || !state.startTime) return -1;

    let elapsed = new Date().getTime() - state.startTime.getTime();

    const timeElement = /** @type {HTMLParagraphElement} */ (document.getElementById('time'));
    timeElement.innerHTML = `Time<br> ${(elapsed/1000).toFixed(2)}`;
    setTimeout(updateTimer, 30);

    return elapsed;
}

/**
 * 
 * @param {number} num number of whites
 * @param {num} dif initial state.colorStep
 */
function make_problem(num, dif){
    const startButtonElement = document.getElementById('start_btn');
    if (startButtonElement != null) startButtonElement.remove();

    state.colorStep = dif;
    const alt = /** @type {HTMLDivElement} */ (document.getElementById('list'));
    const targetColor = /** @type {Color} */ (Color.fromHex('#FFFFFF'));
    alt.innerHTML = "";

    let list = [];
    for(let r = 0; r <= 5; ++r){
        for(let g = 0; g <= 5; ++g){
            for(let b = 0; b <= 5; ++b){
                list.push(targetColor.withDiff({ r, g, b }));
            }
        }
    }

    list = shuffle(list);
    
    alt.innerHTML = list.map((c) => 
        `<div class="alternatives" id="col_${c.toHex().slice(1)}" onclick="submit('${c}')" style="background-color: ${c}"></div>`
    ).slice(0, num).join("");

    state.acColor = list[Math.floor(Math.random() * num)];

    const textElement = /** @type {HTMLParagraphElement} */ (document.getElementById('problem_text'));
    textElement.innerHTML = `この白を探せ！<br>${targetColor}`

    const colorBoxElement = /** @type {HTMLDivElement} */ (document.getElementById('problem_color_box'));
    colorBoxElement.style.setProperty('background-color', targetColor.toHex());

    
    const modalElement = /** @type {HTMLDivElement} */ (document.getElementById('modal_ac'));
    modalElement.style.visibility ="hidden";

    state.score = (dif == 1) ? 1000 : 100;
    state.tryCount = 0;
    state.startTime = new Date();
    state.readyForSubmission = true;

    updateScore();
    updateTimer()
}

window.onload = function(){
    // make_problem(200, 2);
    // make_problem(3, 2);
}
