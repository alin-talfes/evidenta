// ============================================================
// REGULI DE TRANSFER – DECIZIA 360/2020
// rules.js – sursa operațională pentru profilarea din Decizia 360/2020, forma consolidată 30.03.2026
// ============================================================

const UNITATI = [];

// ---------- 1. Penitenciarul Aiud ----------
UNITATI.push({
    id: 'aiud',
    nume: 'Penitenciarul Aiud',
    judeteDeservite: ['Alba', 'Sibiu', 'Hunedoara'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: [],
                semideschis: [],
                inchis: ['Bistrița-Năsăud', 'Maramureș', 'Sălaj', 'Satu Mare', 'Bihor', 'Cluj', 'Alba', 'Sibiu', 'Hunedoara', 'Mureș'],
                maxima: ['Bistrița-Năsăud', 'Maramureș', 'Sălaj', 'Satu Mare', 'Bihor', 'Cluj', 'Alba', 'Sibiu', 'Hunedoara', 'Mureș'],
                masura_educativa_penitenciar: []
            },
            major: {
                deschis: ['Alba', 'Sibiu', 'Mureș', 'Brașov', 'Covasna', 'Harghita'],
                semideschis: [],
                inchis: ['Alba', 'Sibiu', 'Mureș', 'Brașov', 'Covasna'],
                maxima: ['Alba', 'Sibiu', 'Mureș', 'Brașov', 'Covasna', 'Harghita'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Alba', 'Sibiu', 'Hunedoara'],
            tanar: ['Alba', 'Sibiu', 'Hunedoara'],
            major: ['Alba', 'Sibiu', 'Hunedoara']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Alba', 'Sibiu'] },
            tanar: { judete: ['Alba', 'Sibiu'] },
            major: { judete: ['Alba', 'Sibiu'] }
        },
        feminin: {
            minor: { judete: ['Alba', 'Sibiu', 'Hunedoara'] },
            tanar: { judete: ['Alba', 'Sibiu', 'Hunedoara'] },
            major: { judete: ['Alba', 'Sibiu', 'Hunedoara'] }
        },
        risc: {
            masculin: { judete: ['Hunedoara'] },
            feminin: { judete: ['Hunedoara'] }
        }
    }
});

// ---------- 2. Penitenciarul Arad ----------
UNITATI.push({
    id: 'arad',
    nume: 'Penitenciarul Arad',
    judeteDeservite: ['Arad', 'Timiș', 'Caraș-Severin'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: [],
                semideschis: [],
                inchis: ['Arad', 'Timiș', 'Hunedoara', 'Alba', 'Caraș-Severin', 'Gorj', 'Mehedinți'],
                maxima: ['Arad', 'Timiș', 'Hunedoara', 'Alba', 'Caraș-Severin', 'Gorj', 'Mehedinți'],
                masura_educativa_penitenciar: ['toate']
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                semideschis: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            },
            major: {
                deschis: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                semideschis: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Arad'],
            tanar: ['Arad'],
            major: ['Arad']
        },
        feminin: {
            minor: [],
            tanar: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
            major: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Arad', 'Timiș', 'Caraș-Severin'] },
            tanar: { judete: ['Arad', 'Timiș', 'Caraș-Severin'] },
            major: { judete: ['Arad', 'Timiș', 'Caraș-Severin'], excludeRegim: ['semideschis', 'deschis'] }
        },
        feminin: {
            minor: { judete: ['Arad', 'Timiș', 'Caraș-Severin'] },
            tanar: { judete: ['Arad', 'Timiș', 'Caraș-Severin'] },
            major: { judete: ['Arad', 'Timiș', 'Caraș-Severin'] }
        }
    }
});

// ---------- 3. Penitenciarul Bacău ----------
UNITATI.push({
    id: 'bacau',
    nume: 'Penitenciarul Bacău',
    judeteDeservite: ['Bacău', 'Neamț', 'Vaslui'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: ['Botoșani', 'Suceava', 'Iași', 'Neamț', 'Vaslui', 'Bacău', 'Galați', 'Vrancea', 'Brăila'],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Bacău', 'Neamț'],
            tanar: ['Bacău', 'Neamț'],
            major: ['Bacău', 'Neamț']
        },
        feminin: {
            minor: [],
            tanar: ['Botoșani', 'Suceava', 'Iași', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila', 'Bacău', 'Neamț'],
            major: ['Botoșani', 'Suceava', 'Iași', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila', 'Bacău', 'Neamț']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Bacău', 'Neamț'] },
            tanar: { judete: ['Bacău', 'Neamț'] },
            major: { judete: ['Bacău', 'Neamț'] }
        },
        feminin: {
            minor: { judete: ['Vaslui', 'Bacău', 'Neamț'] },
            tanar: { judete: ['Vaslui', 'Bacău', 'Neamț'] },
            major: { judete: ['Vaslui', 'Bacău', 'Neamț'] }
        }
    }
});

// ---------- 4. Penitenciarul Baia Mare ----------
UNITATI.push({
    id: 'baia-mare',
    nume: 'Penitenciarul Baia Mare',
    judeteDeservite: ['Maramureș'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Maramureș', 'Cluj'],
                semideschis: ['Maramureș', 'Cluj'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Maramureș'] },
            tanar: { judete: ['Maramureș'] },
            major: { judete: ['Maramureș'] }
        }
    }
});

// ---------- 5. Penitenciarul Bistrița ----------
UNITATI.push({
    id: 'bistrita',
    nume: 'Penitenciarul Bistrița',
    judeteDeservite: ['Bistrița-Năsăud'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Bistrița-Năsăud', 'Cluj'],
                semideschis: ['Bistrița-Năsăud', 'Cluj'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Bistrița-Năsăud'] },
            tanar: { judete: ['Bistrița-Năsăud'] },
            major: { judete: ['Bistrița-Năsăud'] }
        }
    }
});

// ---------- 6. Penitenciarul Botoșani ----------
UNITATI.push({
    id: 'botosani',
    nume: 'Penitenciarul Botoșani',
    judeteDeservite: ['Botoșani', 'Suceava'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Botoșani', 'Suceava', 'Iași'],
                semideschis: ['Botoșani', 'Suceava', 'Iași'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Botoșani', 'Suceava'],
            tanar: ['Botoșani', 'Suceava'],
            major: ['Botoșani', 'Suceava']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Botoșani', 'Suceava'] },
            tanar: { judete: ['Botoșani', 'Suceava'] },
            major: { judete: ['Botoșani', 'Suceava'] }
        },
        feminin: {
            minor: { judete: ['Botoșani', 'Suceava'] },
            tanar: { judete: ['Botoșani', 'Suceava'] },
            major: { judete: ['Botoșani', 'Suceava'] }
        }
    }
});

// ---------- 7. Penitenciarul Brăila ----------
UNITATI.push({
    id: 'braila',
    nume: 'Penitenciarul Brăila',
    judeteDeservite: ['Brăila', 'Galați'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Brăila', 'Galați'],
                semideschis: ['Brăila', 'Galați', 'Buzău'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            major: { judete: ['Brăila', 'Galați'], doarRegim: ['deschis', 'semideschis'] }
        }
    }
});

// ---------- 8. Penitenciarul București-Jilava ----------
UNITATI.push({
    id: 'jilava',
    nume: 'Penitenciarul București-Jilava',
    judeteDeservite: ['Ilfov', 'București'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['București', 'Ilfov', 'Giurgiu', 'Teleorman'],
                semideschis: ['București', 'Ilfov', 'Giurgiu', 'Teleorman'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            major: { judete: ['Ilfov', 'București'], doarRegim: ['semideschis', 'deschis'] }
        }
    }
});

// ---------- 9. Penitenciarul București-Rahova ----------
UNITATI.push({
    id: 'rahova',
    nume: 'Penitenciarul București-Rahova',
    judeteDeservite: ['Ilfov', 'București'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['București', 'Ilfov', 'Giurgiu', 'Teleorman'],
                semideschis: ['București', 'Ilfov', 'Giurgiu', 'Teleorman'],
                inchis: ['București', 'Ilfov', 'Giurgiu', 'Teleorman'],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: [],
            tanar: ['Ilfov', 'București'],
            major: ['Ilfov', 'București']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Ilfov', 'București'] },
            tanar: { judete: ['Ilfov', 'București'] },
            major: { judete: ['Ilfov', 'București'], excludeRegim: ['semideschis', 'deschis'] }
        }
    }
});

// ---------- 10. Penitenciarul Codlea ----------
UNITATI.push({
    id: 'codlea',
    nume: 'Penitenciarul Codlea',
    judeteDeservite: ['Brașov', 'Covasna'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Brașov', 'Covasna', 'Harghita'],
                semideschis: ['Brașov', 'Covasna', 'Harghita'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Brașov', 'Covasna'],
            tanar: ['Brașov', 'Covasna'],
            major: ['Brașov', 'Covasna']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Brașov', 'Covasna'] },
            tanar: { judete: ['Brașov', 'Covasna'] },
            major: { judete: ['Brașov', 'Covasna'] }
        }
    }
});

// ---------- 11. Penitenciarul Constanța-Poarta Albă ----------
UNITATI.push({
    id: 'constanta',
    nume: 'Penitenciarul Constanța-Poarta Albă',
    judeteDeservite: ['Constanța'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Constanța', 'Călărași'],
                semideschis: ['Constanța', 'Călărași'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Constanța', 'Tulcea'],
            tanar: ['Constanța', 'Tulcea'],
            major: ['Constanța', 'Tulcea']
        },
        feminin: {
            minor: [],
            tanar: ['Constanța', 'Călărași', 'Ialomița', 'Tulcea'],
            major: ['Constanța', 'Călărași', 'Ialomița', 'Tulcea']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Constanța', 'Tulcea'] },
            tanar: { judete: ['Constanța', 'Tulcea'] },
            major: { judete: ['Constanța', 'Tulcea'] }
        },
        feminin: {
            minor: { judete: ['Constanța', 'Tulcea'] },
            tanar: { judete: ['Constanța', 'Tulcea'] },
            major: { judete: ['Constanța', 'Tulcea'] }
        }
    }
});

// ---------- 12. Penitenciarul Craiova ----------
UNITATI.push({
    id: 'craiova',
    nume: 'Penitenciarul Craiova',
    judeteDeservite: ['Dolj', 'Olt', 'Mehedinți', 'Gorj'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: [],
                semideschis: [],
                inchis: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea', 'Arad', 'Timiș', 'Caraș-Severin'],
                maxima: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea', 'Arad', 'Timiș', 'Caraș-Severin'],
                masura_educativa_penitenciar: []
            },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: ['Dolj', 'Olt', 'Argeș', 'Vâlcea'],
                maxima: ['Dolj', 'Olt', 'Argeș', 'Vâlcea'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea'],
                semideschis: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Dolj', 'Olt', 'Gorj'],
            tanar: ['Dolj', 'Olt', 'Gorj'],
            major: ['Dolj', 'Olt', 'Gorj']
        },
        feminin: {
            minor: [],
            tanar: ['Dolj', 'Olt', 'Mehedinți', 'Gorj'],
            major: ['Dolj', 'Olt', 'Mehedinți', 'Gorj']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Dolj', 'Olt'] },
            tanar: { judete: ['Dolj', 'Olt'] },
            major: { judete: ['Dolj', 'Olt'] }
        },
        feminin: {
            minor: { judete: ['Dolj', 'Olt', 'Mehedinți', 'Gorj'] },
            tanar: { judete: ['Dolj', 'Olt', 'Mehedinți', 'Gorj'] },
            major: { judete: ['Dolj', 'Olt', 'Mehedinți', 'Gorj'] }
        }
    }
});

// ---------- 13. Penitenciarul Craiova-Pelendava ----------
UNITATI.push({
    id: 'pelendava',
    nume: 'Penitenciarul Craiova-Pelendava',
    judeteDeservite: [],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Dolj', 'Olt', 'Gorj', 'Mehedinți'],
                semideschis: ['Dolj', 'Olt', 'Gorj', 'Mehedinți'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {}
});

// ---------- 14. Penitenciarul Deva ----------
UNITATI.push({
    id: 'deva',
    nume: 'Penitenciarul Deva',
    judeteDeservite: ['Hunedoara'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Alba', 'Hunedoara', 'Sibiu'],
                semideschis: ['Alba', 'Hunedoara', 'Sibiu'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Hunedoara'] },
            tanar: { judete: ['Hunedoara'] },
            major: { judete: ['Hunedoara'] }
        }
    }
});

// ---------- 15. Penitenciarul Drobeta-Turnu Severin ----------
UNITATI.push({
    id: 'drobeta',
    nume: 'Penitenciarul Drobeta-Turnu Severin',
    judeteDeservite: ['Mehedinți'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Mehedinți', 'Dolj', 'Olt', 'Gorj'],
                semideschis: ['Mehedinți', 'Dolj', 'Olt', 'Gorj'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Mehedinți'],
            tanar: ['Mehedinți'],
            major: ['Mehedinți']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Mehedinți'] },
            tanar: { judete: ['Mehedinți'] },
            major: { judete: ['Mehedinți'] }
        }
    }
});

// ---------- 16. Penitenciarul Focșani ----------
UNITATI.push({
    id: 'focsani',
    nume: 'Penitenciarul Focșani',
    judeteDeservite: ['Buzău', 'Vrancea'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Botoșani', 'Suceava', 'Iași', 'Neamț', 'Vaslui', 'Bacău', 'Galați', 'Vrancea', 'Brăila'],
                semideschis: [],
                inchis: ['Botoșani', 'Suceava', 'Iași', 'Neamț', 'Vaslui', 'Bacău', 'Galați', 'Vrancea', 'Brăila'],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Vrancea', 'Buzău'],
            tanar: ['Vrancea', 'Buzău'],
            major: ['Vrancea', 'Buzău']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Vrancea', 'Buzău'] },
            tanar: { judete: ['Vrancea', 'Buzău'] },
            major: { judete: ['Vrancea', 'Buzău'] }
        },
        feminin: {
            minor: { judete: ['Vrancea', 'Buzău'] },
            tanar: { judete: ['Vrancea', 'Buzău'] },
            major: { judete: ['Vrancea', 'Buzău'] }
        }
    }
});

// ---------- 17. Penitenciarul Găești ----------
UNITATI.push({
    id: 'gaesti',
    nume: 'Penitenciarul Găești',
    judeteDeservite: ['Dâmbovița'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Prahova', 'Dâmbovița', 'Argeș'],
                semideschis: [],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {}
});

// ---------- 18. Penitenciarul Galați ----------
UNITATI.push({
    id: 'galati',
    nume: 'Penitenciarul Galați',
    judeteDeservite: ['Galați', 'Brăila'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: ['Galați', 'Brăila', 'Bacău', 'Vaslui'],
                maxima: ['Galați', 'Brăila', 'Bacău', 'Vaslui'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Brăila', 'Galați'],
            tanar: ['Brăila', 'Galați'],
            major: ['Brăila', 'Galați']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Galați', 'Brăila'] },
            tanar: { judete: ['Galați', 'Brăila'] },
            major: { judete: ['Galați', 'Brăila'], excludeRegim: ['semideschis', 'deschis', 'educativ'] }
        },
        feminin: {
            minor: { judete: ['Galați', 'Brăila'] },
            tanar: { judete: ['Galați', 'Brăila'] },
            major: { judete: ['Galați', 'Brăila'] }
        }
    }
});

// ---------- 19. Penitenciarul Gherla ----------
UNITATI.push({
    id: 'gherla',
    nume: 'Penitenciarul Gherla',
    judeteDeservite: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: [],
                semideschis: [],
                inchis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Mureș', 'Harghita'],
                maxima: ['Cluj', 'Bistrița-Năsăud', 'Mureș', 'Maramureș'],
                masura_educativa_penitenciar: []
            },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Mureș', 'Harghita'],
                maxima: ['Cluj', 'Bistrița-Năsăud', 'Mureș', 'Maramureș'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                semideschis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                inchis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                maxima: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                masura_educativa_penitenciar: []
            },
            major: {
                deschis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                semideschis: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș', 'Botoșani', 'Suceava', 'Iași', 'Neamț'],
                inchis: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                maxima: ['Arad', 'Sălaj', 'Satu Mare', 'Bihor', 'Timiș', 'Caraș-Severin'],
                masura_educativa_penitenciar: []
            }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Cluj', 'Bistrița-Năsăud', 'Maramureș'],
            tanar: ['Cluj', 'Bistrița-Năsăud', 'Maramureș'],
            major: ['Cluj', 'Bistrița-Năsăud', 'Maramureș']
        },
        feminin: {
            minor: [],
            tanar: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș'],
            major: ['Cluj', 'Bistrița-Năsăud', 'Maramureș', 'Alba', 'Sibiu', 'Hunedoara', 'Harghita', 'Mureș']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] },
            tanar: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] },
            major: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] }
        },
        feminin: {
            minor: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] },
            tanar: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] },
            major: { judete: ['Cluj', 'Maramureș', 'Bistrița-Năsăud'] }
        }
    }
});

// ---------- 20. Penitenciarul Giurgiu ----------
UNITATI.push({
    id: 'giurgiu',
    nume: 'Penitenciarul Giurgiu',
    judeteDeservite: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'],
                semideschis: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'],
                inchis: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'],
                maxima: ['Giurgiu', 'Teleorman', 'Ilfov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'București'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: [],
            tanar: ['Giurgiu', 'Teleorman'],
            major: ['Giurgiu', 'Teleorman']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'] },
            tanar: { judete: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'] },
            major: { judete: ['Giurgiu', 'Teleorman', 'Ilfov', 'București'] }
        }
    }
});

// ---------- 21. Penitenciarul Iași ----------
UNITATI.push({
    id: 'iasi',
    nume: 'Penitenciarul Iași',
    judeteDeservite: ['Iași', 'Bacău', 'Vaslui', 'Neamț'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Iași', 'Botoșani', 'Suceava', 'Bacău', 'Neamț', 'Vaslui'],
                semideschis: [],
                inchis: ['Iași', 'Suceava', 'Botoșani', 'Neamț', 'Bacău', 'Vaslui'],
                maxima: ['Iași', 'Suceava', 'Botoșani', 'Neamț'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Iași'],
            tanar: ['Iași'],
            major: ['Iași']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Iași'] },
            tanar: { judete: ['Iași'] },
            major: { judete: ['Iași'] }
        },
        feminin: {
            minor: { judete: ['Iași'] },
            tanar: { judete: ['Iași'] },
            major: { judete: ['Iași'] }
        },
        risc: {
            masculin: { judete: ['Bacău', 'Neamț', 'Vaslui'] },
            feminin: { judete: ['Bacău', 'Neamț', 'Vaslui'] }
        }
    }
});

// ---------- 22. Penitenciarul Mărgineni ----------
UNITATI.push({
    id: 'margineni',
    nume: 'Penitenciarul Mărgineni',
    judeteDeservite: ['Dâmbovița', 'Prahova'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Dâmbovița', 'Prahova', 'Buzău', 'Vrancea'],
                semideschis: [],
                inchis: ['Dâmbovița', 'Prahova', 'Buzău', 'Vrancea'],
                maxima: ['Dâmbovița', 'Prahova', 'Buzău', 'Vrancea'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Dâmbovița', 'Prahova'],
            tanar: ['Dâmbovița', 'Prahova'],
            major: ['Dâmbovița', 'Prahova']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Dâmbovița', 'Prahova'] },
            tanar: { judete: ['Dâmbovița', 'Prahova'] },
            major: { judete: ['Dâmbovița', 'Prahova'], excludeRegim: ['semideschis'] }
        }
    }
});

// ---------- 23. Penitenciarul Miercurea-Ciuc ----------
UNITATI.push({
    id: 'miercurea',
    nume: 'Penitenciarul Miercurea-Ciuc',
    judeteDeservite: ['Harghita'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: ['toate'],
                semideschis: ['toate'],
                inchis: ['toate'],
                maxima: ['toate'],
                masura_educativa_penitenciar: ['toate']
            },
            major: {
                deschis: ['toate'],
                semideschis: [],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: {
                deschis: ['toate'],
                semideschis: ['toate'],
                inchis: ['toate'],
                maxima: ['toate'],
                masura_educativa_penitenciar: ['toate']
            },
            major: {
                deschis: ['toate'],
                semideschis: ['toate'],
                inchis: ['toate'],
                maxima: ['toate'],
                masura_educativa_penitenciar: []
            }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Harghita'],
            tanar: ['Harghita'],
            major: ['Harghita']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Harghita'] },
            tanar: { judete: ['Harghita'] },
            major: { judete: ['Harghita'] }
        },
        feminin: {
            minor: { judete: ['Harghita'] },
            tanar: { judete: ['Harghita'] },
            major: { judete: ['Harghita'] }
        }
    }
});

// ---------- 24. Penitenciarul Mioveni ----------
UNITATI.push({
    id: 'mioveni',
    nume: 'Penitenciarul Mioveni',
    judeteDeservite: ['Argeș', 'Vâlcea'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['toate_munca'],
                semideschis: ['Argeș', 'Vâlcea', 'Dâmbovița'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Argeș', 'Vâlcea'],
            tanar: ['Argeș', 'Vâlcea'],
            major: ['Argeș', 'Vâlcea']
        },
        feminin: {
            minor: [],
            tanar: ['Argeș', 'Vâlcea'],
            major: ['Argeș', 'Vâlcea']
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Argeș', 'Vâlcea'] },
            tanar: { judete: ['Argeș', 'Vâlcea'] },
            major: { judete: ['Argeș', 'Vâlcea'] }
        },
        feminin: {
            minor: { judete: ['Argeș', 'Vâlcea'] },
            tanar: { judete: ['Argeș', 'Vâlcea'] },
            major: { judete: ['Argeș', 'Vâlcea'] }
        }
    }
});

// ---------- 25. Penitenciarul Oradea ----------
UNITATI.push({
    id: 'oradea',
    nume: 'Penitenciarul Oradea',
    judeteDeservite: ['Bihor', 'Sălaj', 'Satu Mare'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Bihor', 'Sălaj', 'Cluj', 'Satu Mare'],
                semideschis: [],
                inchis: ['Bihor', 'Sălaj', 'Cluj', 'Satu Mare'],
                maxima: ['Bihor', 'Sălaj', 'Cluj', 'Satu Mare'],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Bihor', 'Sălaj', 'Satu Mare'],
            tanar: ['Bihor', 'Sălaj', 'Satu Mare'],
            major: ['Bihor', 'Sălaj', 'Satu Mare']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Bihor', 'Sălaj'] },
            tanar: { judete: ['Bihor', 'Sălaj'] },
            major: { judete: ['Bihor', 'Sălaj'] }
        },
        feminin: {
            minor: { judete: ['Bihor', 'Sălaj', 'Satu Mare'] },
            tanar: { judete: ['Bihor', 'Sălaj', 'Satu Mare'] },
            major: { judete: ['Bihor', 'Sălaj', 'Satu Mare'] }
        }
    }
});

// ---------- 26. Penitenciarul Ploiești ----------
UNITATI.push({
    id: 'ploiesti',
    nume: 'Penitenciarul Ploiești',
    judeteDeservite: ['Prahova', 'Dâmbovița'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Prahova', 'Dâmbovița', 'Buzău'],
                semideschis: ['Prahova', 'Dâmbovița', 'Buzău', 'Vrancea'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            major: { judete: ['Prahova', 'Dâmbovița'], doarRegim: ['deschis', 'semideschis'] }
        }
    }
});

// ---------- 27. Penitenciarul Ploiești-Târgșorul Nou ----------
UNITATI.push({
    id: 'targsor',
    nume: 'Penitenciarul Ploiești-Târgșorul Nou',
    judeteDeservite: ['Prahova', 'Dâmbovița', 'București', 'Ilfov', 'Brașov', 'Covasna'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: {
                arestat: ['Prahova', 'Dâmbovița', 'Ilfov', 'București'],
                deschis: [], semideschis: [], inchis: [], maxima: [],
                masura_educativa_penitenciar: []
            },
            tanar: {
                arestat: ['Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Covasna', 'București'],
                deschis: ['Dolj', 'Olt', 'Gorj', 'Mehedinți', 'Argeș', 'Vâlcea', 'Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                semideschis: ['Dolj', 'Olt', 'Gorj', 'Mehedinți', 'Argeș', 'Vâlcea', 'Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                inchis: ['Dolj', 'Olt', 'Gorj', 'Mehedinți', 'Argeș', 'Vâlcea', 'Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                maxima: ['Dolj', 'Olt', 'Gorj', 'Mehedinți', 'Argeș', 'Vâlcea', 'Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                masura_educativa_penitenciar: ['toate']
            },
            major: {
                arestat: ['Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Covasna', 'București'],
                deschis: ['Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                semideschis: ['Prahova', 'Dâmbovița', 'Ilfov', 'Giurgiu', 'Teleorman', 'Brașov', 'Constanța', 'Călărași', 'Ialomița', 'Tulcea', 'Covasna', 'București', 'Bacău', 'Vaslui', 'Vrancea', 'Buzău', 'Galați', 'Brăila'],
                inchis: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea'],
                maxima: ['Dolj', 'Olt', 'Mehedinți', 'Gorj', 'Argeș', 'Vâlcea'],
                masura_educativa_penitenciar: ['toate']
            }
        }
    },
    custodieArestati: {
        masculin: {
            minor: [],
            tanar: [],
            major: []
        },
        feminin: {
            minor: ['Prahova', 'Dâmbovița', 'Ilfov', 'București'],
            tanar: ['Prahova', 'Dâmbovița', 'Ilfov', 'București'],
            major: ['Prahova', 'Dâmbovița', 'Ilfov', 'București']
        }
    },
    transferJudiciar: {
        feminin: {
            minor: { judete: ['Prahova', 'Dâmbovița', 'București', 'Ilfov', 'Brașov', 'Covasna'] },
            tanar: { judete: ['Prahova', 'Dâmbovița', 'București', 'Ilfov', 'Brașov', 'Covasna'] },
            major: { judete: ['Prahova', 'Dâmbovița', 'București', 'Ilfov', 'Brașov', 'Covasna'] }
        }
    }
});

// ---------- 28. Penitenciarul Satu Mare ----------
UNITATI.push({
    id: 'satu-mare',
    nume: 'Penitenciarul Satu Mare',
    judeteDeservite: ['Satu Mare'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Satu Mare', 'Sălaj', 'Bihor'],
                semideschis: ['Satu Mare', 'Sălaj', 'Bihor'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Satu Mare'] },
            tanar: { judete: ['Satu Mare'] },
            major: { judete: ['Satu Mare'] }
        }
    }
});

// ---------- 29. Penitenciarul Slobozia ----------
UNITATI.push({
    id: 'slobozia',
    nume: 'Penitenciarul Slobozia',
    judeteDeservite: ['Ialomița', 'Călărași'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Călărași', 'Ialomița', 'Constanța', 'Tulcea'],
                semideschis: [],
                inchis: ['Călărași', 'Ialomița', 'Constanța', 'Tulcea', 'Buzău'],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Ialomița', 'Călărași'],
            tanar: ['Ialomița', 'Călărași'],
            major: ['Ialomița', 'Călărași']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Ialomița', 'Călărași'] },
            tanar: { judete: ['Ialomița', 'Călărași'] },
            major: { judete: ['Ialomița', 'Călărași'] }
        },
        feminin: {
            minor: { judete: ['Ialomița', 'Călărași'] },
            tanar: { judete: ['Ialomița', 'Călărași'] },
            major: { judete: ['Ialomița', 'Călărași'] }
        }
    }
});

// ---------- 30. S.N.P.A.P. Târgu Ocna ----------
UNITATI.push({
    id: 'snap-tg-ocna',
    nume: 'S.N.P.A.P. Târgu Ocna',
    judeteDeservite: [],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['toate_munca'],
                semideschis: [],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {}
});

// ---------- 31. Penitenciarul Târgu Jiu ----------
UNITATI.push({
    id: 'targu-jiu',
    nume: 'Penitenciarul Târgu Jiu',
    judeteDeservite: ['Gorj'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Gorj', 'Dolj', 'Olt', 'Mehedinți', 'Vâlcea', 'Argeș'],
                semideschis: ['Gorj', 'Dolj', 'Mehedinți', 'Olt', 'Vâlcea'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Gorj'] },
            tanar: { judete: ['Gorj'] },
            major: { judete: ['Gorj'] }
        }
    }
});

// ---------- 32. Penitenciarul Târgu Mureș ----------
UNITATI.push({
    id: 'targu-mures',
    nume: 'Penitenciarul Târgu Mureș',
    judeteDeservite: ['Mureș'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Mureș', 'Harghita'],
                semideschis: ['Mureș', 'Harghita'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Mureș'],
            tanar: ['Mureș'],
            major: ['Mureș']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Mureș'] },
            tanar: { judete: ['Mureș'] },
            major: { judete: ['Mureș'] }
        },
        feminin: {
            minor: { judete: ['Mureș'] },
            tanar: { judete: ['Mureș'] },
            major: { judete: ['Mureș'] }
        }
    }
});

// ---------- 33. Penitenciarul Timișoara ----------
UNITATI.push({
    id: 'timisoara',
    nume: 'Penitenciarul Timișoara',
    judeteDeservite: ['Timiș', 'Caraș-Severin'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Arad', 'Timiș', 'Caraș-Severin'],
                semideschis: ['Arad', 'Timiș', 'Caraș-Severin'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Timiș', 'Caraș-Severin'],
            tanar: ['Timiș', 'Caraș-Severin'],
            major: ['Timiș', 'Caraș-Severin']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            major: { judete: ['Timiș', 'Caraș-Severin'], doarRegim: ['deschis', 'semideschis'] }
        },
        feminin: {
            minor: { judete: ['Timiș', 'Caraș-Severin'], doarRegim: ['arestat'] },
            tanar: { judete: ['Timiș', 'Caraș-Severin'], doarRegim: ['arestat'] },
            major: { judete: ['Timiș', 'Caraș-Severin'], doarRegim: ['arestat'] }
        }
    }
});

// ---------- 34. Penitenciarul Tulcea ----------
UNITATI.push({
    id: 'tulcea',
    nume: 'Penitenciarul Tulcea',
    judeteDeservite: ['Tulcea'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Tulcea', 'Brăila', 'Galați', 'Ialomița', 'Constanța'],
                semideschis: ['Tulcea', 'Brăila', 'Galați', 'Ialomița', 'Constanța', 'Vrancea'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Tulcea'],
            tanar: ['Tulcea'],
            major: ['Tulcea']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Tulcea'] },
            tanar: { judete: ['Tulcea'] },
            major: { judete: ['Tulcea'] }
        },
        feminin: {
            minor: { judete: ['Tulcea'] },
            tanar: { judete: ['Tulcea'] },
            major: { judete: ['Tulcea'] }
        }
    }
});

// ---------- 35. Penitenciarul Vaslui ----------
UNITATI.push({
    id: 'vaslui',
    nume: 'Penitenciarul Vaslui',
    judeteDeservite: ['Vaslui'],
    custodie: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: {
                deschis: ['Vaslui', 'Bacău', 'Iași'],
                semideschis: ['Vaslui', 'Vrancea', 'Bacău', 'Iași'],
                inchis: [],
                maxima: [],
                masura_educativa_penitenciar: []
            }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
        }
    },
    custodieArestati: {
        masculin: {
            minor: ['Vaslui'],
            tanar: ['Vaslui'],
            major: ['Vaslui']
        },
        feminin: {
            minor: [],
            tanar: [],
            major: []
        }
    },
    transferJudiciar: {
        masculin: {
            minor: { judete: ['Vaslui'] },
            tanar: { judete: ['Vaslui'] },
            major: { judete: ['Vaslui'] }
        }
    }
});

// ---------- 36. Centrul Educativ Buziaș ----------
UNITATI.push({
    id: 'buzias',
    nume: 'Centrul Educativ Buziaș',
    judeteDeservite: ['Timiș'],
    categorii: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        }
    },
    educativ: true,
    educativJudeteMasculin: ['Satu Mare', 'Maramureș', 'Bistrița-Năsăud', 'Mureș', 'Sibiu', 'Sălaj', 'Alba', 'Arad', 'Timiș', 'Caraș-Severin', 'Hunedoara', 'Cluj', 'Bihor', 'Gorj', 'Dolj', 'Olt', 'Vâlcea', 'Mehedinți', 'Argeș', 'Giurgiu', 'Teleorman', 'București', 'Ilfov'],
    educativJudeteFeminin: ['toate'],
    transferJudiciar: {}
});

// ---------- 37. Centrul Educativ Târgu Ocna ----------
UNITATI.push({
    id: 'tg-ocna',
    nume: 'Centrul Educativ Târgu Ocna',
    judeteDeservite: ['Bacău'],
    categorii: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        }
    },
    educativ: true,
    educativJudeteMasculin: ['Botoșani', 'Suceava', 'Iași', 'Vaslui', 'Bacău', 'Neamț', 'Brașov', 'Covasna', 'Harghita', 'Vrancea', 'Galați', 'Brăila', 'Buzău', 'Prahova', 'Ialomița', 'Călărași', 'Tulcea', 'Constanța', 'Dâmbovița'],
    educativJudeteFeminin: [],
    transferJudiciar: {}
});

// ---------- 38. Centrul de Detenție Craiova ----------
UNITATI.push({
    id: 'cd-craiova',
    nume: 'Centrul de Detenție Craiova',
    judeteDeservite: ['Dolj', 'Olt'],
    categorii: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        }
    },
    detentie: true,
    detentieJudeteMasculin: ['Dolj', 'Olt', 'Gorj', 'Mehedinți', 'Caraș-Severin', 'Timiș', 'Arad', 'Argeș', 'Vâlcea', 'Dâmbovița', 'Hunedoara', 'Alba', 'Sibiu', 'Bihor', 'Sălaj', 'Satu Mare', 'Maramureș', 'Bistrița-Năsăud', 'Mureș', 'Brașov', 'Harghita', 'Covasna', 'Cluj'],
    detentieJudeteFeminin: ['toate'],
    transferJudiciar: {}
});

// ---------- 39. Centrul de Detenție Tichilești ----------
UNITATI.push({
    id: 'tichilesti',
    nume: 'Centrul de Detenție Tichilești',
    judeteDeservite: ['Brăila', 'Galați'],
    categorii: {
        masculin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        },
        feminin: {
            minor: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            tanar: { deschis: [], semideschis: [], inchis: [], maxima: [] },
            major: { deschis: [], semideschis: [], inchis: [], maxima: [] }
        }
    },
    detentie: true,
    detentieJudeteMasculin: ['Brăila', 'Galați', 'Tulcea', 'Constanța', 'Ialomița', 'Călărași', 'Prahova', 'Buzău', 'Vrancea', 'Bacău', 'Neamț', 'Suceava', 'Botoșani', 'Iași', 'Vaslui', 'Giurgiu', 'Teleorman', 'Ilfov', 'București'],
    detentieJudeteFeminin: [],
    transferJudiciar: {}
});

// ---------- Spitale-penitenciar ----------
const spitale = [
    'Penitenciarul-Spital București-Jilava',
    'Penitenciarul-Spital București-Rahova',
    'Penitenciarul-Spital Târgu-Ocna',
    'Penitenciarul-Spital Mioveni',
    'Penitenciarul-Spital Constanța-Poarta Albă',
    'Penitenciarul-Spital Dej'
];
spitale.forEach(n => {
    UNITATI.push({
        id: 'spital-' + n.replace(/\s/g, '-').toLowerCase(),
        nume: n,
        judeteDeservite: [],
        categorii: {
            masculin: {
                minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
                tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
                major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
            },
            feminin: {
                minor: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
                tanar: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] },
                major: { deschis: [], semideschis: [], inchis: [], maxima: [], masura_educativa_penitenciar: [] }
            }
        },
        spital: true,
        transferJudiciar: {}
    });
});

// ============================================================
// LISTA JUDEȚELOR GRUPATE PE CURȚI DE APEL
// ============================================================
const JUDETE_GRUPATE = {
    'Alba Iulia': ['Alba', 'Hunedoara', 'Sibiu'],
    'Bacău': ['Bacău', 'Neamț'],
    'Brașov': ['Brașov', 'Covasna'],
    'București': ['București', 'Călărași', 'Ialomița', 'Giurgiu', 'Ilfov', 'Teleorman'],
    'Cluj': ['Bistrița-Năsăud', 'Cluj', 'Maramureș', 'Sălaj'],
    'Constanța': ['Constanța', 'Tulcea'],
    'Craiova': ['Dolj', 'Gorj', 'Mehedinți', 'Olt'],
    'Galați': ['Brăila', 'Galați', 'Vrancea'],
    'Iași': ['Iași', 'Vaslui'],
    'Oradea': ['Bihor', 'Satu Mare'],
    'Pitești': ['Argeș', 'Vâlcea'],
    'Ploiești': ['Buzău', 'Prahova', 'Dâmbovița'],
    'Suceava': ['Botoșani', 'Suceava'],
    'Târgu Mureș': ['Harghita', 'Mureș'],
    'Timișoara': ['Arad', 'Caraș-Severin', 'Timiș']
};

// ============================================================
// FUNCȚIA PRINCIPALĂ DE CĂUTARE
// ============================================================
function gasesteUnitati(sex, varsta, regim, judet, mode, risc = false) {
    const regimKey = regim;

    // --- Caz special: educativ / detenție ---
    if (regimKey === 'educativ') {
        const matches = [];
        UNITATI.forEach(u => {
            if (u.educativ) {
                let judeteList = null;
                if (sex === 'masculin' && u.educativJudeteMasculin) {
                    judeteList = u.educativJudeteMasculin;
                } else if (sex === 'feminin' && u.educativJudeteFeminin) {
                    judeteList = u.educativJudeteFeminin;
                }
                if (Array.isArray(judeteList) && (judeteList.includes(judet) || judeteList.includes('toate'))) {
                    matches.push({ unitate: u, regimJudete: judeteList, judeteDeservite: u.judeteDeservite || [], isCustodie: true });
                }
            }
            if (u.detentie) {
                let judeteList = null;
                if (sex === 'masculin' && u.detentieJudeteMasculin) {
                    judeteList = u.detentieJudeteMasculin;
                } else if (sex === 'feminin' && u.detentieJudeteFeminin) {
                    judeteList = u.detentieJudeteFeminin;
                }
                if (Array.isArray(judeteList) && (judeteList.includes(judet) || judeteList.includes('toate'))) {
                    matches.push({ unitate: u, regimJudete: judeteList, judeteDeservite: u.judeteDeservite || [] });
                }
            }
        });
        return matches;
    }

    // --- Modul CUSTODIE ARESTAȚI PREVENTIV ---
    if (mode === 'custodieArestati') {
        const matches = [];
        UNITATI.forEach(u => {
            if (u.educativ || u.detentie || u.spital) return;
            const custArest = u.custodieArestati;
            if (!custArest) return;
            const sexData = custArest[sex];
            if (!sexData) return;
            const judeteList = sexData[varsta];
            if (!judeteList || !Array.isArray(judeteList)) return;
            if (judeteList.includes(judet)) {
                matches.push({ unitate: u, regimJudete: judeteList, judeteDeservite: u.judeteDeservite || [] });
            }
        });
        return matches;
    }

    // --- Modul EXECUTARE: folosește 'custodie' fără arest ---
    if (mode === 'executare') {
        const matches = [];
        UNITATI.forEach(u => {
            if (u.educativ || u.detentie || u.spital) return;

            const catSex = u.custodie?.[sex];
            if (!catSex) return;

            const catVarsta = catSex[varsta];
            if (!catVarsta) return;

            const judeteRegim = catVarsta[regimKey];
            if (!judeteRegim || !Array.isArray(judeteRegim)) return;

            const match = judeteRegim.includes(judet) || judeteRegim.includes('toate') || judeteRegim.includes('toate_munca');
            if (match) {
                const esteMunca = judeteRegim.includes('toate_munca');
                matches.push({
                    unitate: u,
                    regimJudete: judeteRegim,
                    judeteDeservite: u.judeteDeservite || [],
                    esteMunca: esteMunca
                });
            }
        });
        return matches;
    }

    // --- Modul JUDICIAR (prezentare la organe judiciare) ---
    if (mode === 'judiciar') {
        const matches = [];
        UNITATI.forEach(u => {
            if (u.educativ || u.detentie || u.spital) return;
            if (!u.transferJudiciar) return;

            if (risc) {
                const riscRules = u.transferJudiciar.risc;
                if (!riscRules) return;
                const sexRisc = riscRules[sex];
                if (!sexRisc) return;
                if (!sexRisc.judete || !sexRisc.judete.includes(judet)) return;
                matches.push({
                    unitate: u,
                    regimJudete: sexRisc.judete,
                    judeteDeservite: u.judeteDeservite || [],
                    isRisc: true
                });
                return;
            }

            const sexRules = u.transferJudiciar[sex];
            if (!sexRules) return;

            const varstaRules = sexRules[varsta];
            if (!varstaRules) return;

            const rules = varstaRules;

            if (!rules.judete || !rules.judete.includes(judet)) return;
            if (rules.excludeRegim && rules.excludeRegim.includes(regimKey)) return;
            if (rules.doarRegim && !rules.doarRegim.includes(regimKey)) return;

            matches.push({
                unitate: u,
                regimJudete: rules.judete,
                judeteDeservite: u.judeteDeservite || [],
                isRisc: false
            });
        });

        return matches;
    }

    return [];
}


// ============================================================
// METADATE DE CONFORMITATE – DECIZIA 360/2020
// Forma consolidată utilizată: 30.03.2026 (inclusiv Ordinul ANP nr. 105/2026).
// IMPORTANT: custodieArestati reprezintă profilarea pentru custodie permanentă A.P.
// și NU arondarea distinctă pentru primirea inițială de la organele de poliție (Anexa 3).
// ============================================================
const TRANSFER_PROFILE_META = Object.freeze({
    act: 'Decizia directorului general ANP nr. 360/2020',
    consolidatedAt: '30.03.2026',
    latestAmendment: 'Ordinul ANP nr. 105/2026',
    annexes: Object.freeze({ profile: 1, sections: 2, policeReception: 3, provisionalRegime: 4, educationalMeasures: 5, transit: 6, forensic: 7, severeMentalDisorders: 8 })
});
