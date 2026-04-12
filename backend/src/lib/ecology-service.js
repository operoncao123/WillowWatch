function getDistrictEcology(district) {
  return {
    weight: district.ecologyWeight,
    hotspots: [...district.hotspots],
  };
}

module.exports = {
  getDistrictEcology,
};
