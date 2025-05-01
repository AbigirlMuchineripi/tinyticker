
document.addEventListener('DOMContentLoaded', () =>{
  
    const COIN_API_URL = 'https://api.coingecko.com/api/v3';
    const SEARCH_ENDPOINT ='/search';
    const COIN_ENDPOINT = '/coins/markets';
    const API_KEY = window.config?.API_KEY || '';

    const searchInput = document.getElementById('search-bar');
    const searchBtn = document.getElementById('search-btn');
    const cryptoListings = document.querySelector('.main-card__crypto-listings');

    let addedCryptos =[];
    const MAX_CRYPTOS = 5;

    function displayError(message){
        const errorElement = document.createElement("div");
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.padding = '10px';
        errorElement.style.textAlign = 'center';
        errorElement.style.display = 'block';

        if(cryptoListings){
            const previousError = cryptoListings.querySelector('.error-message');
            if (previousError){
                cryptoListings.removeChild(previousError);

            }
            cryptoListings.appendChild(errorElement);

            setTimeout(() => {
                if (errorElement.parentNode ===cryptoListings){
                    cryptoListings.removeChild(errorElement);

                }
            },3000);

        }
    }
    


    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) =>{
        if( e.key ==='Enter'){
            handleSearch();
        }
    });

    initializePopularCryptos();

    async function initializePopularCryptos(){
        try{ 
            const url = `${COIN_API_URL}${COIN_ENDPOINT}?vs-currency=usd&order=market_cap_desc&per_page=5&page=1&x_cg_demo_api_key=${API_KEY}`;
            const response = await fetch(url);
            if(!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            data.forEach(crypto => {
                addCrytoList({
                    id: crypto.id,
                    name:crypto.name,
                    symbol:crypto.symbol.toUpperCase(),
                    image: crypto.image,
                    price:crypto.current_price,
                    priceChange:crypto.price_change_percentage_24h

                });
                
            });

        }
        catch (error){
            console.error('Error fetching popular cryptos:', error);
            displayError('Loading your coins...');
        }
    }


    async function handleSearch() {
        const query = searchInput.value.trim();
        if(!query) return;

        try {

            const url = `${COIN_API_URL}${SEARCH_ENDPOINT}?query=${encodeURIComponent(query)}&x_cg_demo_api_key=${API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data.coins && data.coins.length > 0){
                const coinId = data.coins[0].id;

                if (addedCryptos.includes(coinId)){
                    searchInput.value ="";
                    displayError(`${data.coins[0].name} is already added`);
                    return;
                }

                await fetchAndAddCrypto(coinId);
                searchInput.value ="";
            }else{
                displayError('No cryptocurrency found with that name');

            }       

        }catch (error){
            console.error('Error searching for crypto:', error);
            displayError('Failed to search for cryptocurrency');
        }
    }
    async function fetchAndAddCrypto(coinId){
        try{
            const url = `${COIN_API_URL}${COIN_ENDPOINT}?vs_currency=usd&ids=${coinId}&x_cg_demo_api_key=${API_KEY}`;
            const response = await fetch(url);
            if(!response.ok) throw new Error('Network Failed');

            const data = await response.json();

            if (data && data.length > 0){
                const crypto =data[0];

                if(addedCryptos.length >= MAX_CRYPTOS){
                    const firstChild =cryptoListings.firstElementChild;
                    if(firstChild){
                        cryptoListings.removeChild(firstChild);
                        addedCryptos.shift(); 
                    }
                }
                addCrytoList({
                    id: crypto.id,
                    name: crypto.name,
                    symbol: crypto.symbol.toUpperCase(),
                    image: crypto.image,
                    price: crypto.current_price,
                    priceChange: crypto.price_change_percentage_24h

                });
            }
        }catch (error){
            console.error('Error fetching crypto details:', error);
            displayError('Failed to get cryptocurrency details');
        }
    }

    function addCrytoList(crypto){
        const cryptoItem =document.createElement('div');
        cryptoItem.className = 'crypto-item';

        const formattedPrice = formatPrice(crypto.price);
        const formattedChange = formatPriceChange(crypto.priceChange);
        const changeClass = crypto.priceChange >= 0 ? 'positive-change' : 'negative-change';


        cryptoItem.innerHTML = `
        <div class="crypto-left">
           <img class="crypto-logo" 
              src="${crypto.image}"
              alt="${crypto.name} logo">
           <div class="crypto-info">
                 <span class="crypto-name">${crypto.name}</span>
                <span class="crypto-abbr">${crypto.symbol}</span>
           </div>
        </div>
        
        <div class="crypto-right">
                <span class="crypto-price">$${formattedPrice}</span>
                <span class="crypto-chage ${changeClass}">${formattedChange}</span>
        
        </div>       
        `;

        cryptoListings.appendChild(cryptoItem);
        addedCryptos.push(crypto.id);
    }

    function formatPrice(price){
        if(price >= 1000){
            return price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});

        }else if(price >=1){
            return price.toFixed(2)
        }else{
            return price.toFixed(6);
        }
    }

    function formatPriceChange(change){
        if(!change && change !==0) return 'N/A';

        const prefix = change >= 0 ?'+' : "";
        return `${prefix}${change.toFixed(2)}%`;
    }
});