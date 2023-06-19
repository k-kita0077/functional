import {vi, describe, test, expect, afterEach} from "vitest"

describe('カリー化', () => {

  test('2項関数', () => {

    const multipleOf = (n,m) => {
      if(m % n === 0) { /* m / n の余りが 0 かどうか */
        return true;
      } else {
        return false;
      }
    };

    expect(
      multipleOf(2,4)/* 4は、2の倍数である */
    ).toBe(true)

    expect(
      multipleOf(2,5)/* 5は、2の倍数ではない */
    ).toBe(false)

  });

  test('multipleOfをカリー化', () => {

    const multipleOf = (n) => (m) => {
      if(m % n === 0) { /* m / n の余りが 0 かどうか */
        return true;
      } else {
        return false;
      }
    }

    const twoFold = multipleOf(2)

    expect(
      twoFold(4)/* 4は、2の倍数である */
    ).toBe(true)

    expect(
      twoFold(5)/* 5は、2の倍数ではない */
    ).toBe(false)

  });

});

describe('コンビネータ', () => {

  test('機能を変更する', () => {

    const exponential = (base) => {
      return (index) => {
        if(index === 0){
          return 1;
        } else {
          return base * exponential(base)(index - 1);
        }
      };
    };

    expect(
      exponential(2)(3) /* 2の3乗 */
    ).toBe(8)

    expect(
      exponential(3)(2) /* 3の2乗 */
    ).toBe(9)

    const flip = (f) => {
      return (x) => {
        return (y) => {
          return f(y)(x);
        };
      };
    }

    const square = flip(exponential)(2) // 2錠を求める関数
    const cube = flip(exponential)(3) // 3錠を求める関数

    expect(
      square(3) /* 3の2乗 */
    ).toBe(9)

    expect(
      cube(2) /* 2の3乗 */
    ).toBe(8)

  });


  test('関数合成', () => {

    const compose = (f: any, g: any) => {
      return (arg: any) => {
        return f(g(arg))
      }
    }

    const f = (x: number) => x * x + 1
    const g = (x: number) => x - 2

    const h = compose(f, g) // ふたつの関数を合成して、新しい関数を作る

    expect(
      h(2)
    ).toBe(f(g(2)))

    const gx = g(2)
    const fx = f(gx)
    
    expect(
      h(2)
    ).toBe(fx)

    const add = (x: number, y: number) => {
      return x + y
    }

    const addCurry = (x: number) => {
      return (y: number) => {
        return add(x, y)
      }
    }

    expect(
      compose(addCurry(2), g)(3)
    ).toBe(3)

  });
});

describe('クロージャー', () => {

  test('クロージャーで不変なデータ型を作る', () => {

    const object = {  // objectモジュール

      empty: (key) => {
        return null;
      },
      set: (key, value) => {
        return (obj) => {
          return (queryKey) => {
            if(key === queryKey) {
              return value;
            } else {
              return object.get(queryKey)(obj);
            }
          };
        };
      },
      get: (key) => {
        return (obj) => {
          return obj(key);
        };
      }
    };

    const robot = object.set('C3PO', 'star wars')(object.empty) // 1つデータが入っている
    const robots = object.set('HAL9000', '2001: a space odessay')(robot) // 2つデータが入っている

    expect(
      object.get('C3PO')(robots)
    ).toBe('star wars')

    expect(
      object.get('HAL9000')(robots)
    ).toBe('2001: a space odessay')

    expect(
      object.get('R2D2')(robots)
    ).toBe(null)

  });


});

describe('関数を渡す', () => {

  test('コールバック', () => {
    const succ = (n) => {
      return n + 1;
    };

    const setupCallback = (callback) => {
      /* コールバック関数を実行する無名関数を返す */
      return (arg) => {  
        return callback(arg);
      };
    };

    const doCallback = setupCallback(succ);

    expect(
      doCallback(2)
    ).toBe(3)

  });

  test('畳み込み関数', () => {
  
    const list = {
      match : (data, pattern) => {
        return data.call(list, pattern);
      },
      empty: () => {
        return (pattern) => {
          return pattern.empty();
        };
      },
      cons: (value, alist) => {
        return (pattern) => {
          return pattern.cons(value, alist);
        };
      },

      sum: (alist) => {
        return (accumulator) => {
          return list.match(alist,{
            empty: (_) => {
              return accumulator;
            },
            cons: (head, tail) => {
              return list.sum(tail)(accumulator + head);
            }
          });
        };
      },

      // コールバック関数を用いたsum関数の再定義
      sumWithCallback: (alist) => {
        return (accumulator) => {
          return (CALLBACK) => { // コールバック関数を受け取る
            return list.match(alist,{
              empty: (_) => {
                return accumulator;
              },
              cons: (head, tail) => {
                return CALLBACK(head)( // コールバック関数を呼び出す
                  list.sumWithCallback(tail)(accumulator)(CALLBACK)
                );
              }
            });
          };
        };
      },

      length: (alist) => {
        return (accumulator) => {
          return list.match(alist,{
            empty: (_) => {
              return accumulator;
            },
            cons: (head, tail) => {
              return list.length(tail)(accumulator + 1);
            }
          });
        };
      },

      // 関数の再定義
      lengthWithCallback: (alist) => {
        return (accumulator) => {
          return (CALLBACK) => { // コールバック関数を受け取る
            return list.match(alist,{
              empty: (_) => {
                return accumulator;
              },
              cons: (head, tail) => {
                return CALLBACK(head)(
                  list.lengthWithCallback(tail)(accumulator)(CALLBACK)
                );
              }
            });
          };
        };
      },

      foldr: (alist) => {
        return (accumulator) => {
          return (callback) => {
            return list.match(alist,{
              empty: (_) => {
                return accumulator;
              },
              cons: (head, tail) => {
                return callback(head)(list.foldr(tail)(accumulator)(callback));
              }
            });
          };
        };
      },
  
      foldrSum: (alist) => {
        return list.foldr(alist)(0)((item) => {
          return (accumulator) => {
            return accumulator + item;
          };
        });
      },

      foldrLength: (alist) => {
        return list.foldr(alist)(0)((item) => {
          return (accumulator) => {
            return accumulator + 1;
          };
        });
      },


    };

    const numbers = list.cons(1, 
                            list.cons(2,
                                      list.cons(3,
                                                list.empty())));


    expect(
      list.sum(numbers)(0)
    ).toBe(
      6
    );

    const sumCallback = (n) => {  
      return (m) => {
        return n + m;
      };
    };
    expect(
      list.sumWithCallback(numbers)(0)(sumCallback)
    ).toBe(
      6  // 1 + 2 + 3 = 6
    );

    expect(
      list.length(numbers)(0)
    ).toBe(
      3
    );

    const lengthCallback = (n) => {  
      return (m) => {
        return 1 + m;
      };
    };
    expect(
      list.lengthWithCallback(numbers)(0)(lengthCallback)
    ).toBe(
      3
    );




    expect(
      list.foldrSum(numbers)
    ).toBe(
      6
    );

    expect(
      list.foldrLength(numbers)
    ).toBe(
      3
    );

  });
    
});


describe('継続渡し', () => {

  test("単純な継続渡し", () => {
    const identity = (any) => { // 値をそのまま返すだけの継続
      return any;
    };

    /* 継続渡しのsucc関数 */
    const succ = (n, continues) => { 
      return continues(n + 1);
    };
    /* 継続渡しのadd関数 */
    const add = (n,m, continues) => { 
      return continues(n + m);
    };
    /* 継続渡しのsucc関数とadd関数を使って 
       add(2, succ(3)) を計算する */
    expect(
      succ(3, (succResult) => {
        return add(2, succResult, identity);
      })
    ).toBe(
      6
    );
  });

  test("複数の継続渡し", () => {

    const find = (aStream,
                predicate, 
                continuesOnFailure, 
                continuesOnSuccess) => {
                  return list.match(aStream, {
                    /* リストの最末尾に到着した場合
                      成功継続で反復処理を抜ける */
                    empty: () => {
                      return continuesOnSuccess(null); 
                    },
                    cons: (head, tailThunk) => { 
                      /* 目的の要素を見つけた場合
                        成功継続で反復処理を脱出する */
                      if(predicate(head) === true) { 
                        return continuesOnSuccess(head); 
                      } else { 
                        /* 目的の要素を見つけられなった場合、
                          失敗継続で次の反復処理を続ける */
                        return continuesOnFailure(tailThunk(), 
                                                  predicate,
                                                  continuesOnFailure,
                                                  continuesOnSuccess);
                      };
                    }
                  });
                };


    // find関数に渡す2つの継続
    const identity = (any) => {
      return any;
    };

    /* 成功継続では、反復処理を脱出する */
    const continuesOnSuccess = identity; 

    /* 失敗継続では、反復処理を続ける */
    const continuesOnFailure = (aStream,
                              predicate, 
                              continuesOnRecursion, 
                              escapesFromRecursion) => { 
                                /* find関数を再帰的に呼び出す */
                                return find( 
                                  aStream, 
                                  predicate, 
                                  continuesOnRecursion, 
                                  escapesFromRecursion
                                );  
                              };


    /* 変数integersは、無限の整数ストリーム */
    const integers = stream.enumFrom(0);

    /* 無限の整数列のなかから100を探す */
    expect(
      find(integers, (item) => {
        return (item === 100); 
      }, continuesOnFailure, continuesOnSuccess)
    ).toBe(
      100 // 100を見つけて返ってくる
    );
  });
});




// listモジュール
const list  = {
  match : (data, pattern) => {
    return data.call(list, pattern);
  },
  empty: () => {
    return (pattern) => {
      return pattern.empty();
    };
  },
  cons: (value, alist) => {
    return (pattern) => {
      return pattern.cons(value, alist);
    };
  },
  head: (alist) => {
    return list.match(alist, {
      empty: (_) => {
        return null;
      },
      cons: (head, tail) => {
        return head;
      }
    });
  },
  tail: (alist) => {
    return list.match(alist, {
      empty: (_) => {
        return null;
      },
      cons: (head, tail) => {
        return tail;
      }
    });
  },
  isEmpty: (alist) => {
    return list.match(alist, {
      empty: (_) => {
        return true;
      },
      cons: (head, tail) => {
        return false;
      }
    });
  },
  /* append:: LIST[T] -> LIST[T] -> LIST[T] */
  append: (xs) => {
    return (ys) => {
      return list.match(xs, {
        empty: (_) => {
          return ys;
        },
        cons: (head, tail) => {
          return list.cons(head, list.append(tail)(ys)); 
        }
      });
    };
  },
  /* map:: LIST[T] -> FUNC[T -> T] -> LIST[T] */
  map: (alist) => {
    return (transform) => {
      return list.match(alist,{
        empty: (_) => {
          return list.empty();
        },
        cons: (head,tail) => {
          return list.cons(transform(head),list.map(tail)(transform));
        }
      });
    };
  },
  reverse: (alist) => {
    const reverseAux = (alist, accumulator) => {
      return list.match(alist, {
        empty: (_) => {
          return accumulator;  // 空のリストの場合は終了
        },
        cons: (head, tail) => {
          return reverseAux(tail, list.cons(head, accumulator));
        }
      });
    };
    return reverseAux(alist, list.empty());
  },
  toArray: (alist) => {
    const toArrayAux = (alist,accumulator) => {
      return list.match(alist, {
        empty: (_) => {
          return accumulator;  // 空のリストの場合は終了
        },
        cons: (head, tail) => {
          return toArrayAux(tail, accumulator.concat(head));
        }
      });
    };
    return toArrayAux(alist, []);
  },
  fromArray: (array) => {
    expect(array).to.an('array');
    return array.reduce((accumulator, item) => {
      return list.append(accumulator)(list.cons(item, list.empty()));
    }, list.empty());
  }
};


// streamモジュール
const stream = {
  match: (data, pattern) => {
    return data.call(stream, pattern);
  },
  empty: () => {
    return (pattern) => {
      expect(pattern).to.an('object');
      return pattern.empty();
    };
  },
  cons: (head,tailThunk) => {
    expect(tailThunk).to.a('function');
    return (pattern) => {
      expect(pattern).to.an('object');
      return pattern.cons(head,tailThunk);
    };
  },
  /* head:: STREAM -> MAYBE[STREAM] */
  head: (lazyList) => {
    return stream.match(lazyList,{
      empty: (_) => {
        return null;
      },
      cons: (value, tailThunk) => {
        return value;
      }
    });
  },
  /* tail:: STREAM -> MAYBE[STREAM] */
  tail: (lazyList) => {
    return stream.match(lazyList,{
      empty: (_) => {
        return null;
      },
      cons: (head, tailThunk) => {
        return tailThunk();
      }
    });
  },
  isEmpty: (lazyList) => {
    return stream.match(lazyList,{
      empty: (_) => {
        return true;
      },
      cons: (head,tailThunk) => {
        return false;
      }
    });
  },
  /* take:: STREAM -> NUMBER -> STREAM */
  take: (lazyList) => {
    return (number) => {
      expect(number).to.a('number');
      expect(number).to.be.greaterThan(-1);
      return stream.match(lazyList,{
        empty: (_) => {
          return stream.empty();
        },
        cons: (head,tailThunk) => {
          if(number === 0) {
            return stream.empty();
          } else {
            return stream.cons(head,(_) => {
              return stream.take(tailThunk())(number -1);
            });
          }
        }
      });
    };
  },
  enumFrom: (from) => {
    return stream.cons(from, (_) => {
      return stream.enumFrom(from + 1);
    });
  },
  forAll: (astream) => {
    return (predicate) => {
      const forAllHelper = (astream) => {
        return stream.match(astream,{
          empty: (_) => {
            return true; 
          },
          cons: (head,tailThunk) => {
            return predicate(head) && forAllHelper(tailThunk());
          }
        });
      };
      return stream.match(astream,{
        empty: (_) => {
          return false; // 空のストリームの場合は、必ず false が返る
        },
        cons: (head,tailThunk) => {
          return forAllHelper(astream);   
        }
      });
    };
  }
};

describe('モナド', () => {

  describe("恒等モナド", () => {

    const ID = {
      /* unit:: T => ID[T] */
      unit: (value) => {  // 単なる identity関数と同じ
        return value;
      },
      /* flatMap:: ID[T] => FUN[T => ID[T]] => ID[T] */
      flatMap: (instanceM) => {
        return (transform) => {
          return transform(instanceM); // 単なる関数適用と同じ
        };
      },
    };

    test("unit", () => {

      expect(
        ID.unit(1)
      ).toBe(
        1
      );

    });

    test("flatMap", () => {
      const succ = (n) => {
        return n + 1;
      };

      expect(
        ID.flatMap(ID.unit(1))((one) => {    
          return ID.unit(succ(one));
        })
      ).toBe(
        succ(1)
      );

    });

    test("flatMapと関数合成の類似性", () => {

      const compose = (f,g) => {
        return (arg) => {
          return f(g(arg));
        };
      };

      const succ = (n) => {
        return n + 1;
      };

      const double = (m) => {
        return m * 2;
      };


      expect(
        ID.flatMap(ID.unit(1))((one) => {    
          /* succ関数を適用する */
          return ID.flatMap(ID.unit(succ(one)))((two) => { 
            /* double関数を適用する */
            return ID.unit(double(two));  
          });
        })
      ).toBe(
        compose(double,succ)(1)
      );
    });

    test("恒等モナドのモナド則", () => {

      /* flatMap(instanceM)(unit) === instanceM の一例 */
      const instanceM = ID.unit(1);
      // 右単位元則
      expect(
        ID.flatMap(instanceM)(ID.unit)
      ).toBe(
        instanceM
      );

      const f = (n) => {
        return ID.unit(n + 1);
      };
      // 左単位元則
      expect(
        ID.flatMap(ID.unit(1))(f)
      ).toBe(
        f(1)
      );

      const g = (n) => {
        return ID.unit(- n);
      };

      // 結合法則
      expect(
        ID.flatMap(ID.flatMap(instanceM)(f))(g)
      ).toBe(
        ID.flatMap(instanceM)((x) => {
          return ID.flatMap(f(x))(g);
        })
      );

    });

  });

  describe("Maybeモナド", () => {

    const maybe = {
      match: (exp, pattern) => {
        return exp.call(pattern, pattern);
      },
      just: (value) => {
        return (pattern) => {
          return pattern.just(value);
        };
      },
      nothing: () => {
        return (pattern) => {
          return pattern.nothing();
        };
      }
    };
    // Maybeモナドの定義
    const MAYBE = {
      /* unit:: T => MAYBE[T] */
      unit: (value) => {
        return maybe.just(value);
      },
      /* flatMap:: MAYBE[T] => FUN[T => MAYBE[U]] => MAYBE[U] */
      flatMap: (instanceM) => {
        return (transform) => {
          return maybe.match(instanceM,{
            /* 正常な値の場合は、transform関数を計算する */
            just: (value) => { 
              return transform(value);
            },
            /* エラーの場合は、何もしない */
            nothing: () => { 
              return maybe.nothing();
            }
          });
        };
      },
      /* ヘルパー関数  */
      getOrElse: (instanceM) => {
        return (alternate) => {
          return maybe.match(instanceM,{
            just: (value) => {
              return value;
            },
            nothing: (_) => {
              return alternate;
            }
          });
        };
      },
    };

    test("Maybeモナドの利用法", (next) => {

      /* 足し算を定義する */
      const add = (maybeA,maybeB) => {
        return MAYBE.flatMap(maybeA)((a) => {
          return MAYBE.flatMap(maybeB)((b) => {
            return MAYBE.unit(a + b);
          });
        });
      };
      const justOne = MAYBE.unit(1);
      const justTwo = MAYBE.unit(2);

      expect(
        MAYBE.getOrElse(add(justOne,justTwo))(null) 
      ).to.eql(
        3
      );
      expect(
        MAYBE.getOrElse(add(maybe.nothing(), justOne))(null)
      ).to.eql(
        null
      );
    });

  });

});


describe('IOモナド', () => {
  const match = (data, pattern) => {
    return data.call(pattern, pattern);
  };

  const pair = {
    /* pair のデータ構造 */
    cons: (left, right) => {
      return (pattern) => {
        return pattern.cons(left, right);
      };
    },
    /* ペアの右側を取得する */
    right: (tuple) => {
      return match(tuple, {
        cons: (left, right) => {
          return right;
        }
      });
    },
    /* ペアの左側を取得する */
    left: (tuple) => {
      return match(tuple, {
        cons: (left, right) => {
          return left;
        }
      });
    }
  };

  var IO = {
    /* unit:: T => IO[T] */
    unit: (any) => {
      return (world) =>  {  // worldは現在の外界
        return pair.cons(any, world);
      };
    },
    /* flatMap:: IO[T] => FUN[T => IO[U]] => IO[U] */
    flatMap: (instanceA) => {
      return (actionAB) => { // actionAB:: FUN[T => IO[U]]
        return (world) => {
          const newPair = instanceA(world); // 現在の外界のなかで instanceAのIOアクションを実行する
          return match(newPair,{
            cons: (value, newWorld) => {
              return actionAB(value)(newWorld); // 新しい外界のなかで、actionAB(value)で作られたIOアクションを実行する
            }
          });
        };
      };
    },

    println: (message) => {
      return (world) => { // IOモナドを返す
        console.log(message);
        return IO.unit(null)(world);
      };
    },

    //IOモナドの補助関数
    /* done:: T => IO[T] */
    done: (any) => {
      return IO.unit(any);
    },
    /* run:: IO[A] => A */
    run: (instance) => {
      return (world) => {
        const newPair = instance(world); // IOモナドのインスタンス(アクション)を現在の外界に適用する
        return pair.left(newPair);     // 結果だけを返す
      };
    },
  };


  const initialWorld = null; 

  test("IOモナド", () => {
    expect(
      IO.run(IO.println("我輩は猫である"))(initialWorld)
    ).toBe(
      null
    );
  });


});
