(function () {
    if (typeof Prism === 'undefined') {
        return;
    }

    function joinAlias(cur, i) {
        if (!cur) {
            return i
        } else if (typeof cur === "string") {
            return [cur, i]
        } else if (cur instanceof Array) {
            return [...cur, i]
        }
        throw new Error("unknown alias type: " + cur)
    }

    function addFolds(env) {
        if (env.language !== 'json')
            return
        function nestTokens(tokens, left) {
            const tokenAppender = []
            let right = left
            while (right < tokens.length) {
                const token = tokens[right]
                if (token.type === "punctuation" && (token.content === "}" || token.content === "]")) {
                    break
                } else if (token.type === "punctuation" && (token.content === "{" || token.content === "[")) {
                    const endPtn = token.content === "{" ? "}" : "]"
                    const child = nestTokens(tokens, right + 1)
                    if (tokens[child.right].content === endPtn) {
                        const headTokens = [new Prism.Token(token.type, token.content, joinAlias(token.alias, "braces-start"))]
                        const tailTokens = [tokens[child.right]]
                        right = child.right
                        if (child.right + 1 < tokens.length && tokens[child.right + 1].type === "punctuation" && tokens[child.right + 1].content === ",") {
                            tailTokens.push(tokens[child.right + 1])
                            right++;
                        }
                        if (child.tokenAppender.length > 0) {
                            for (let i = tokenAppender.length - 1; i >= 0; i--) {
                                if (typeof tokenAppender[i] === "string" && tokenAppender[i].includes("\n")) {
                                    const backN = tokenAppender.length - (i + 1)
                                    for (let j = 0; j < backN; j++) {
                                        headTokens.unshift(tokenAppender.pop())
                                    }
                                    break
                                }
                            }
                            const childTokens = [...child.tokenAppender, ...tailTokens]
                            const newToken = new Prism.Token("tag-details", [new Prism.Token("tag-summary", [...headTokens, ...tailTokens], ""), ...childTokens], "");
                            tokenAppender.push(newToken)
                        } else {
                            tokenAppender.push(...headTokens)
                            tokenAppender.push(...tailTokens)
                        }
                    } else {
                        // wrong closure, do nothing
                        throw new Error(`close punctuation not match, need=${endPtn}, get=${tokens[child.right].content}`)
                    }
                } else {
                    tokenAppender.push(token)
                }
                right++
            }
            return { tokenAppender, right }
        }
        // For chromium>=128 : Tag </detail> and </summery> always create newline, move last text token to outter, and remove a "\n" to make it right
        function dirtyRemoveExtraClrf(tokens) {
            const newTokens = []
            let needRemove = false
            for (const token of tokens) {
                let newToken = token
                if (token instanceof Prism.Token) {
                    if (token.type === "tag-details" || token.type === "tag-summary") {
                        needRemove = true
                    }
                    if (Array.isArray(token.content)) {
                        newToken = new Prism.Token(token.type, dirtyRemoveExtraClrf(token.content), token.alias)
                    }
                } else if (typeof token === "string") {
                    if (needRemove) {
                        newToken = token.replace("\n", "")
                        needRemove = false
                    }
                }
                newTokens.push(newToken)
            }
            return newTokens
        }

        // For chromium<128 or safari/firefox : Tag </detail> always add indent same with itself, remove it !!!
        function dirtyRemoveExtraSpace(tokens, parentSpace) {
            const newTokens = []
            let curSpace = 0
            for (const token of tokens) {
                let newToken = token
                if (typeof token === "string" && token.includes("\n")) {
                    curSpace = token.split("").filter(i => i === " ").length
                    newToken = token.replace(" ".repeat(parentSpace), "")
                } else if (token instanceof Prism.Token && token.type === "tag-details") {
                    newToken = new Prism.Token(token.type, dirtyRemoveExtraSpace(token.content, curSpace), token.alias)
                }
                newTokens.push(newToken)
            }
            return newTokens
        }

        if (Array.isArray(env.tokens)) {
            try {
                env.tokens = nestTokens(env.tokens, 0).tokenAppender
                let dirtyStg = (typeof process !== "undefined" && process.env.PRISM_IN_CHROME_LIKE) || (typeof window !== "undefined" && window.PRISM_IN_CHROME_LIKE) || "auto"
                if (dirtyStg === "auto") {
                    dirtyStg = "old"
                    if (window.navigator.userAgentData) {
                        let vendors = window.navigator.userAgentData.brands;
                        for (const vendor of vendors) {
                            if ((vendor.brand === "Google Chrome" && vendor.version > 128) || (vendor.brand === "Chromium" && vendor.version >= 128)) {
                                dirtyStg = "new"
                            }
                        }
                    }
                }
                if (dirtyStg === "new") {
                    env.tokens = dirtyRemoveExtraClrf(env.tokens)
                } else if (dirtyStg === "old") {
                    env.tokens = dirtyRemoveExtraSpace(env.tokens, 0, 0)
                }
            } catch (e) { console.log(e) }
        }
    }

    function recoverTag(token) {
        if (token.type === "tag-details") {
            token.tag = "details"
            token.attributes["open"] = ""
        } else if (token.type === "tag-summary") {
            token.tag = "summary"
        }
    }

    Prism.hooks.add('after-tokenize', addFolds)
    Prism.hooks.add('wrap', recoverTag)

}());