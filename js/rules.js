// ========== REGULI DE CALCUL (SFINTE, NU SE MODIFICĂ) ==========

// Tabelul sacru cu fracții de liberare condiționată
const liberationRules = [
    { article:"NCP100", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3] },
    { article:"NCP100", age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3,7305], total:[3,4,7305] },
    { article:"NCP100", age:["BATRAN"], maxYears:10, mandatory:[1,3], total:[1,2] },
    { article:"NCP100", age:["BATRAN"], minYears:10, mandatory:[1,2,7305], total:[2,3,7305] },
    { article:"NCP99",  age:["MINOR","TANAR","MAJOR","BATRAN"], life:true, mandatory:[1,2,7305], total:[1,2,7305] },
    { article:"NCP124", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2] },
    { article:"NCP125", age:["MINOR","TANAR","MAJOR","BATRAN"], mandatory:[1,2], total:[1,2] },
    { article:"VCP59",  age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,2], total:[2,3] },
    { article:"VCP59",  age:["MAJOR","TANAR"], minYears:10, mandatory:[2,3], total:[3,4] },
    { article:"VCP591", age:["MAJOR","TANAR"], maxYears:10, mandatory:[1,3], total:[1,2] },
    { article:"VCP591", age:["MAJOR","TANAR"], minYears:10, mandatory:[1,2], total:[2,3] },
    { article:"VCP602", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,3] },
    { article:"VCP602", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,2] },
    { article:"VCP603", age:["BATRAN"], maxYears:10, mandatory:[1,100], total:[1,4] },
    { article:"VCP603", age:["BATRAN"], minYears:10, mandatory:[1,100], total:[1,3] }
];

/**
 * Determină categoria de vârstă la o dată dată.
 * @param {Date} birthDate - data nașterii
 * @param {Date} targetDate - data de referință
 * @param {string} currentSex - 'M' sau 'F'
 * @param {string} articleValue - valoarea articolului de liberare (ex: "NCP100")
 * @returns {string} - "MINOR", "TANAR", "MAJOR", "BATRAN"
 */
function getAgeCategoryAtDate(birthDate, targetDate, currentSex, articleValue) {
    const ageY = ageExact(birthDate, targetDate).y;
    if (ageY < 18) return "MINOR";
    if (ageY < 21) return "TANAR";
    const isNCP = articleValue ? articleValue.startsWith("NCP") : true;
    const elderly = isNCP ? (ageY >= 60) : ((currentSex === 'M' && ageY >= 60) || (currentSex === 'F' && ageY >= 55));
    return elderly ? "BATRAN" : "MAJOR";
}

/**
 * Calculează fracțiile de liberare condiționată și plafoanele.
 * @param {boolean} life - detențiune pe viață
 * @param {string} art - articolul selectat (ex: "NCP100")
 * @param {string} ageAtExpiry - categoria de vârstă la expirare
 * @param {boolean} sentenceOver10 - dacă pedeapsa > 10 ani (luni totale > 120)
 * @param {number} totalDays - zile totale mandat (util pentru viață)
 * @param {Date} birthDate - data nașterii (necesar pentru NCP100)
 * @param {Date} theorExp - data expirării teoretice (necesar pentru NCP100)
 * @returns {object} - { mR, tR, pM, pT, articleInfo, error? }
 */
function getLiberationFractions(life, art, ageAtExpiry, sentenceOver10, totalDays, birthDate, theorExp) {
    let mR = 1/2, tR = 2/3, pM = Infinity, pT = Infinity, articleInfo = '';

    if (life) {
        mR = 1/2;
        tR = 1/2;
        pM = totalDays;
        pT = totalDays;
        articleInfo = 'NCP art. 99 (viață)';
    } else {
        if (art === 'NCP100') {
            // Determinare specială pentru NCP100 bazată pe vârsta la expirare
            const sixtiethBirthday = new Date(birthDate.getFullYear() + 60, birthDate.getMonth(), birthDate.getDate());
            const expiresBefore60 = theorExp < sixtiethBirthday;
            if (expiresBefore60) {
                if (sentenceOver10) {
                    mR = 2/3;
                    tR = 3/4;
                    pM = 7305;
                    pT = 7305;
                } else {
                    mR = 1/2;
                    tR = 2/3;
                }
                articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră < 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            } else {
                if (sentenceOver10) {
                    mR = 1/2;
                    tR = 2/3;
                    pM = 7305;
                    pT = 7305;
                } else {
                    mR = 1/3;
                    tR = 1/2;
                }
                articleInfo = `NCP art. 100 (${ageAtExpiry}, expiră ≥ 60 ani) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            }
        } else {
            const rule = liberationRules.find(r =>
                r.article === art &&
                r.age.includes(ageAtExpiry) &&
                ((r.life && life) || 
                 (!r.life && ((r.maxYears && !sentenceOver10) ||
                              (r.minYears && sentenceOver10) ||
                              (!r.maxYears && !r.minYears))))
            );
            if (rule) {
                mR = rule.mandatory[0] / rule.mandatory[1];
                tR = rule.total[0] / rule.total[1];
                pM = rule.mandatory[2] || Infinity;
                pT = rule.total[2] || Infinity;
                articleInfo = `${art} (${ageAtExpiry}) ${sentenceOver10 ? '>10 ani' : '≤10 ani'}`;
            } else {
                return { error: 'Nu există regulă de liberare pentru această combinație.' };
            }
        }
    }

    return { mR, tR, pM, pT, articleInfo };
}

/**
 * Unifică intervalele de perioade deduse și calculează totalul de zile.
 * @param {Array<[Date, Date]>} intervals - perechi [start, end]
 * @returns {number} - total zile deduse (cu capete incluse)
 */
function sumIntervals(intervals) {
    if (!intervals.length) return 0;
    const sorted = intervals.slice().sort((a, b) => a[0].getTime() - b[0].getTime());
    let total = daysBetween(sorted[0][0], sorted[0][1]) + 1;
    let currentEnd = sorted[0][1];
    for (let i = 1; i < sorted.length; i++) {
        const [start, end] = sorted[i];
        if (start <= currentEnd) {
            if (end > currentEnd) {
                total += daysBetween(currentEnd, end);
                currentEnd = end;
            }
        } else {
            total += daysBetween(start, end) + 1;
            currentEnd = end;
        }
    }
    return total;
}
