type Unit = {
  _id: string,
  measures: Measure[]
}

type Measure = {
  _id: string,
  name: {[key: string]: string}
}
