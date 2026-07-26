async function run() {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AQ.Ab8RN6IpWXZQMq2N9G9B9PshxhTvgmQHASYEwoZs-_2wOXL7Og');
        const text = await res.text();
        console.log(text);
    } catch(e) {
        console.error(e);
    }
}
run();
