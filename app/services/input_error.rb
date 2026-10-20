class InputError
  def self.message(error)
    return 'Vnesite veljaven datum.' if error.is_a?(Date::Error)
    return 'Izpolnite vsa zahtevana polja.' if error.is_a?(KeyError)
    return 'Preverite obliko vnesenih števil, datumov in polj.' if error.is_a?(TypeError) || error.message.match?(/\A(?:invalid |can't convert|no implicit conversion|out of range|wrong number|incompatible )/i)
    error.message
  end
end
