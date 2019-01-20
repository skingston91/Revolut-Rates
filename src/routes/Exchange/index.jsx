import React, { Component } from "react";
import { connect } from "react-redux";

import Header from "../../components/Header";
import Icon from "../../components/Icon";
import ExchangeCurrency from "../../components/ExchangeCurrency";

import { ReactComponent as Close } from "../../assets/icons/x.svg";
import { ReactComponent as TrendingUp } from "../../assets/icons/trending-up.svg";
import { ReactComponent as Switch } from "../../assets/icons/shuffle.svg";

import { fetchCurrencyData } from "../../state/actions/index";

import { calculateTransaction } from "../../helpers";

import "./styles.scss";

const closeIcon = {
  SvgComponent: Close,
  stroke: "black"
};

const ratesIcon = {
  SvgComponent: TrendingUp,
  stroke: "black"
};

const ratesBlueIcon = {
  SvgComponent: TrendingUp,
  stroke: "#0167fd",
  height: "1rem",
  width: "1rem"
};

const switchBlueIcon = {
  SvgComponent: Switch,
  stroke: "#0167fd"
};

// The requests only work as USD on the free account for this api
// Otherwise this wouldn't need to exist
const availableBaseCurrencies = {
  USD: {
    symbol: "$"
  }
};

const availableCurrencies = {
  GBP: {
    symbol: "£"
  },
  USD: {
    symbol: "$"
  },
  EUR: {
    acronym: "EUR",
    symbol: "€"
  }
};

const userReducer = {
  defaultCurrency: "USD",
  money: {
    GBP: 200,
    USD: 100,
    EUR: 0
  }
};

// defaultCurrentCurrency, currentBalance would normally come from a users reducer
class Exchange extends Component {
  constructor() {
    super();
    this.state = {
      convertFrom: userReducer.defaultCurrency,
      convertTo: "GBP",
      currencyFromAmount: 0,
      currencyToAmount: 0
    };
  }

  componentDidMount() {
    // TODO un-comment out when using as an application so else you will hit the api data limit
    // The requests only work as USD on the free account for this api
    // this.interval = setInterval(
    //   () => this.props.fetchCurrencyData(this.state.convertFrom),
    //   10000
    // );
    this.props.fetchCurrencyData(this.state.convertFrom);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  handleSwitch = () => {
    const { convertFrom, convertTo } = this.state;
    this.setState({ convertFrom: convertTo, convertTo: convertFrom });
    // TODO we could just invert the data in this instance rather than making a new request
    // (and that would save us a extra request although that would happen in the next 10 seconds anyway)
    this.props.fetchCurrencyData(convertTo);
  };

  render() {
    const { currencyData } = this.props;
    const {
      convertFrom,
      convertTo,
      currencyFromAmount,
      currencyToAmount
    } = this.state;

    const currentCurrencyData = currencyData[convertFrom];
    if (!currentCurrencyData) {
      return <p>Loading...</p>;
    }

    if (
      (currentCurrencyData && currentCurrencyData.error) ||
      (!currentCurrencyData.result || !currentCurrencyData.result[convertTo])
    ) {
      return <p>{currentCurrencyData.error}!</p>;
    }

    const currentRate = currentCurrencyData.result[convertTo];

    return (
      <div className="Exchange">
        <Header
          headerText="Exchange"
          leftIconProps={closeIcon}
          leftLink={"/"}
          rightIconProps={ratesIcon}
          rightLink={"/rates/rates"}
        />
        {currentCurrencyData && currentCurrencyData.result && (
          <React.Fragment>
            <ExchangeCurrency
              currentCurrency={convertFrom}
              availableCurrencies={Object.keys(availableBaseCurrencies)}
              subText={`Balance: ${
                availableCurrencies[convertFrom].symbol
              }${userReducer.money[convertFrom] || 0.0}`}
              currencyAmount={currencyFromAmount}
              handleCurrencyChange={newCurrencyFromAmount => {
                const newCurrencyToAmount = calculateTransaction(
                  newCurrencyFromAmount,
                  currentRate,
                  false
                );
                this.setState({
                  currencyFromAmount: newCurrencyFromAmount,
                  currencyToAmount: newCurrencyToAmount
                });
              }}
              handleCurrencyTypeChange={currency => {
                this.setState({ convertFrom: currency });
                this.props.fetchCurrencyData(currency);
              }}
              prefix="-"
            />

            <div className="Exchange__center">
              <button
                className="Exchange__switch"
                onClick={() => this.handleSwitch()}
              >
                <Icon {...switchBlueIcon} />
              </button>
              <div className="Exchange__rate">
                <Icon {...ratesBlueIcon} />
                <h4 className="Exchange__rate--text">{`${
                  availableCurrencies[convertFrom].symbol
                }1 = ${
                  availableCurrencies[convertTo].symbol
                }${Number.parseFloat(currentRate).toFixed(4)}`}</h4>
              </div>
            </div>

            <div className="Exchange__bottom">
              <ExchangeCurrency
                currentCurrency={convertTo}
                availableCurrencies={Object.keys(availableCurrencies)}
                subText={`Balance: ${
                  availableCurrencies[convertTo].symbol
                }${userReducer.money[convertTo] || 0.0}`}
                currencyAmount={currencyToAmount}
                handleCurrencyChange={newCurrencyToAmount => {
                  const newCurrentCurrencyAmount = calculateTransaction(
                    newCurrencyToAmount,
                    currentCurrencyData.result[convertTo],
                    true
                  );
                  this.setState({
                    currencyFromAmount: newCurrentCurrencyAmount,
                    currencyToAmount: newCurrencyToAmount
                  });
                }}
                handleCurrencyTypeChange={currency => {
                  this.setState({ convertTo: currency });
                }}
                prefix="+"
              />
              <div className="Exchange__button">
                <input type="button" value="Exchange" />
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currencyData: state.currency
  };
}

function mapDispatchToProps(dispatch) {
  return {
    fetchCurrencyData: currency => dispatch(fetchCurrencyData(currency))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Exchange);
