/**
 * Country dialling data for `PhoneInput`. Generated once from `libphonenumber-js`'s metadata
 * (Apache-2.0) and committed, so the phone field carries no phone-library dependency at runtime.
 * The flags it renders are the MIT-licensed SVGs vendored in `public/flags/`.
 *
 * `nationalPrefix` is the digit dialled before the national number at home (the `0` in the UK or
 * Bangladesh, the `1` in the US); it is stripped on the way into the E.164 value.
 *
 * Do not hand-edit — these numbers come from the metadata.
 */

export interface Country {
  /** ISO 3166-1 alpha-2 code. */
  code: string
  name: string
  /** Country calling code, without the leading `+`. */
  dialCode: string
  /** Trunk prefix dialled at home; `null` where the country has none. */
  nationalPrefix: string | null
  minLength: number
  maxLength: number
}

export const COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan', dialCode: '93', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'AX', name: 'Åland Islands', dialCode: '358', nationalPrefix: '0', minLength: 5, maxLength: 12 },
  { code: 'AL', name: 'Albania', dialCode: '355', nationalPrefix: '0', minLength: 6, maxLength: 9 },
  { code: 'DZ', name: 'Algeria', dialCode: '213', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'AS', name: 'American Samoa', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'AD', name: 'Andorra', dialCode: '376', nationalPrefix: null, minLength: 6, maxLength: 9 },
  { code: 'AO', name: 'Angola', dialCode: '244', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'AI', name: 'Anguilla', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'AG', name: 'Antigua & Barbuda', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'AR', name: 'Argentina', dialCode: '54', nationalPrefix: '0', minLength: 10, maxLength: 11 },
  { code: 'AM', name: 'Armenia', dialCode: '374', nationalPrefix: '0', minLength: 8, maxLength: 8 },
  { code: 'AW', name: 'Aruba', dialCode: '297', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'AC', name: 'Ascension Island', dialCode: '247', nationalPrefix: null, minLength: 5, maxLength: 6 },
  { code: 'AU', name: 'Australia', dialCode: '61', nationalPrefix: '0', minLength: 5, maxLength: 12 },
  { code: 'AT', name: 'Austria', dialCode: '43', nationalPrefix: '0', minLength: 4, maxLength: 13 },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '994', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'BS', name: 'Bahamas', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'BH', name: 'Bahrain', dialCode: '973', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'BD', name: 'Bangladesh', dialCode: '880', nationalPrefix: '0', minLength: 6, maxLength: 10 },
  { code: 'BB', name: 'Barbados', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'BY', name: 'Belarus', dialCode: '375', nationalPrefix: '8', minLength: 6, maxLength: 11 },
  { code: 'BE', name: 'Belgium', dialCode: '32', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'BZ', name: 'Belize', dialCode: '501', nationalPrefix: null, minLength: 7, maxLength: 11 },
  { code: 'BJ', name: 'Benin', dialCode: '229', nationalPrefix: null, minLength: 8, maxLength: 10 },
  { code: 'BM', name: 'Bermuda', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'BT', name: 'Bhutan', dialCode: '975', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'BO', name: 'Bolivia', dialCode: '591', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'BA', name: 'Bosnia & Herzegovina', dialCode: '387', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'BW', name: 'Botswana', dialCode: '267', nationalPrefix: null, minLength: 7, maxLength: 10 },
  { code: 'BR', name: 'Brazil', dialCode: '55', nationalPrefix: '0', minLength: 8, maxLength: 11 },
  {
    code: 'IO',
    name: 'British Indian Ocean Territory',
    dialCode: '246',
    nationalPrefix: null,
    minLength: 7,
    maxLength: 7,
  },
  { code: 'VG', name: 'British Virgin Islands', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'BN', name: 'Brunei', dialCode: '673', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'BG', name: 'Bulgaria', dialCode: '359', nationalPrefix: '0', minLength: 6, maxLength: 12 },
  { code: 'BF', name: 'Burkina Faso', dialCode: '226', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'BI', name: 'Burundi', dialCode: '257', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'KH', name: 'Cambodia', dialCode: '855', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'CM', name: 'Cameroon', dialCode: '237', nationalPrefix: null, minLength: 8, maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '1', nationalPrefix: '1', minLength: 7, maxLength: 10 },
  { code: 'CV', name: 'Cape Verde', dialCode: '238', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'BQ', name: 'Caribbean Netherlands', dialCode: '599', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'KY', name: 'Cayman Islands', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'CF', name: 'Central African Republic', dialCode: '236', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'TD', name: 'Chad', dialCode: '235', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'CL', name: 'Chile', dialCode: '56', nationalPrefix: null, minLength: 9, maxLength: 11 },
  { code: 'CN', name: 'China', dialCode: '86', nationalPrefix: '0', minLength: 7, maxLength: 12 },
  { code: 'CX', name: 'Christmas Island', dialCode: '61', nationalPrefix: '0', minLength: 6, maxLength: 12 },
  { code: 'CC', name: 'Cocos (Keeling) Islands', dialCode: '61', nationalPrefix: '0', minLength: 6, maxLength: 12 },
  { code: 'CO', name: 'Colombia', dialCode: '57', nationalPrefix: '0', minLength: 8, maxLength: 11 },
  { code: 'KM', name: 'Comoros', dialCode: '269', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'CG', name: 'Congo - Brazzaville', dialCode: '242', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'CD', name: 'Congo - Kinshasa', dialCode: '243', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'CK', name: 'Cook Islands', dialCode: '682', nationalPrefix: null, minLength: 5, maxLength: 5 },
  { code: 'CR', name: 'Costa Rica', dialCode: '506', nationalPrefix: null, minLength: 8, maxLength: 10 },
  { code: 'CI', name: 'Côte d’Ivoire', dialCode: '225', nationalPrefix: null, minLength: 10, maxLength: 10 },
  { code: 'HR', name: 'Croatia', dialCode: '385', nationalPrefix: '0', minLength: 7, maxLength: 9 },
  { code: 'CU', name: 'Cuba', dialCode: '53', nationalPrefix: '0', minLength: 6, maxLength: 10 },
  { code: 'CW', name: 'Curaçao', dialCode: '599', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'CY', name: 'Cyprus', dialCode: '357', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'CZ', name: 'Czechia', dialCode: '420', nationalPrefix: null, minLength: 9, maxLength: 12 },
  { code: 'DK', name: 'Denmark', dialCode: '45', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'DJ', name: 'Djibouti', dialCode: '253', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'DM', name: 'Dominica', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'DO', name: 'Dominican Republic', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'EC', name: 'Ecuador', dialCode: '593', nationalPrefix: '0', minLength: 8, maxLength: 11 },
  { code: 'EG', name: 'Egypt', dialCode: '20', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'SV', name: 'El Salvador', dialCode: '503', nationalPrefix: null, minLength: 7, maxLength: 11 },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '240', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'ER', name: 'Eritrea', dialCode: '291', nationalPrefix: '0', minLength: 7, maxLength: 7 },
  { code: 'EE', name: 'Estonia', dialCode: '372', nationalPrefix: null, minLength: 7, maxLength: 10 },
  { code: 'SZ', name: 'Eswatini', dialCode: '268', nationalPrefix: null, minLength: 8, maxLength: 9 },
  { code: 'ET', name: 'Ethiopia', dialCode: '251', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'FK', name: 'Falkland Islands', dialCode: '500', nationalPrefix: null, minLength: 5, maxLength: 5 },
  { code: 'FO', name: 'Faroe Islands', dialCode: '298', nationalPrefix: null, minLength: 6, maxLength: 6 },
  { code: 'FJ', name: 'Fiji', dialCode: '679', nationalPrefix: null, minLength: 7, maxLength: 11 },
  { code: 'FI', name: 'Finland', dialCode: '358', nationalPrefix: '0', minLength: 5, maxLength: 12 },
  { code: 'FR', name: 'France', dialCode: '33', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'GF', name: 'French Guiana', dialCode: '594', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'PF', name: 'French Polynesia', dialCode: '689', nationalPrefix: null, minLength: 6, maxLength: 9 },
  { code: 'GA', name: 'Gabon', dialCode: '241', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'GM', name: 'Gambia', dialCode: '220', nationalPrefix: null, minLength: 7, maxLength: 9 },
  { code: 'GE', name: 'Georgia', dialCode: '995', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'DE', name: 'Germany', dialCode: '49', nationalPrefix: '0', minLength: 4, maxLength: 15 },
  { code: 'GH', name: 'Ghana', dialCode: '233', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'GI', name: 'Gibraltar', dialCode: '350', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'GR', name: 'Greece', dialCode: '30', nationalPrefix: null, minLength: 10, maxLength: 12 },
  { code: 'GL', name: 'Greenland', dialCode: '299', nationalPrefix: null, minLength: 6, maxLength: 6 },
  { code: 'GD', name: 'Grenada', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'GP', name: 'Guadeloupe', dialCode: '590', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'GU', name: 'Guam', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'GT', name: 'Guatemala', dialCode: '502', nationalPrefix: null, minLength: 8, maxLength: 11 },
  { code: 'GG', name: 'Guernsey', dialCode: '44', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'GN', name: 'Guinea', dialCode: '224', nationalPrefix: null, minLength: 8, maxLength: 9 },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '245', nationalPrefix: null, minLength: 7, maxLength: 9 },
  { code: 'GY', name: 'Guyana', dialCode: '592', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'HT', name: 'Haiti', dialCode: '509', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'HN', name: 'Honduras', dialCode: '504', nationalPrefix: null, minLength: 8, maxLength: 11 },
  { code: 'HK', name: 'Hong Kong SAR China', dialCode: '852', nationalPrefix: null, minLength: 5, maxLength: 11 },
  { code: 'HU', name: 'Hungary', dialCode: '36', nationalPrefix: '06', minLength: 8, maxLength: 9 },
  { code: 'IS', name: 'Iceland', dialCode: '354', nationalPrefix: null, minLength: 7, maxLength: 9 },
  { code: 'IN', name: 'India', dialCode: '91', nationalPrefix: '0', minLength: 8, maxLength: 13 },
  { code: 'ID', name: 'Indonesia', dialCode: '62', nationalPrefix: '0', minLength: 7, maxLength: 17 },
  { code: 'IR', name: 'Iran', dialCode: '98', nationalPrefix: '0', minLength: 4, maxLength: 10 },
  { code: 'IQ', name: 'Iraq', dialCode: '964', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '353', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'IM', name: 'Isle of Man', dialCode: '44', nationalPrefix: '0', minLength: 10, maxLength: 10 },
  { code: 'IL', name: 'Israel', dialCode: '972', nationalPrefix: '0', minLength: 7, maxLength: 12 },
  { code: 'IT', name: 'Italy', dialCode: '39', nationalPrefix: null, minLength: 6, maxLength: 12 },
  { code: 'JM', name: 'Jamaica', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '81', nationalPrefix: '0', minLength: 8, maxLength: 17 },
  { code: 'JE', name: 'Jersey', dialCode: '44', nationalPrefix: '0', minLength: 10, maxLength: 10 },
  { code: 'JO', name: 'Jordan', dialCode: '962', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '7', nationalPrefix: '8', minLength: 10, maxLength: 14 },
  { code: 'KE', name: 'Kenya', dialCode: '254', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'KI', name: 'Kiribati', dialCode: '686', nationalPrefix: '0', minLength: 5, maxLength: 8 },
  { code: 'XK', name: 'Kosovo', dialCode: '383', nationalPrefix: '0', minLength: 8, maxLength: 12 },
  { code: 'KW', name: 'Kuwait', dialCode: '965', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '996', nationalPrefix: '0', minLength: 9, maxLength: 10 },
  { code: 'LA', name: 'Laos', dialCode: '856', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'LV', name: 'Latvia', dialCode: '371', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'LB', name: 'Lebanon', dialCode: '961', nationalPrefix: '0', minLength: 7, maxLength: 8 },
  { code: 'LS', name: 'Lesotho', dialCode: '266', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'LR', name: 'Liberia', dialCode: '231', nationalPrefix: '0', minLength: 7, maxLength: 9 },
  { code: 'LY', name: 'Libya', dialCode: '218', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'LI', name: 'Liechtenstein', dialCode: '423', nationalPrefix: '0', minLength: 7, maxLength: 9 },
  { code: 'LT', name: 'Lithuania', dialCode: '370', nationalPrefix: '0', minLength: 8, maxLength: 8 },
  { code: 'LU', name: 'Luxembourg', dialCode: '352', nationalPrefix: null, minLength: 4, maxLength: 11 },
  { code: 'MO', name: 'Macao SAR China', dialCode: '853', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'MG', name: 'Madagascar', dialCode: '261', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'MW', name: 'Malawi', dialCode: '265', nationalPrefix: '0', minLength: 7, maxLength: 9 },
  { code: 'MY', name: 'Malaysia', dialCode: '60', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'MV', name: 'Maldives', dialCode: '960', nationalPrefix: null, minLength: 7, maxLength: 10 },
  { code: 'ML', name: 'Mali', dialCode: '223', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'MT', name: 'Malta', dialCode: '356', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'MH', name: 'Marshall Islands', dialCode: '692', nationalPrefix: '1', minLength: 7, maxLength: 7 },
  { code: 'MQ', name: 'Martinique', dialCode: '596', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'MR', name: 'Mauritania', dialCode: '222', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'MU', name: 'Mauritius', dialCode: '230', nationalPrefix: null, minLength: 7, maxLength: 10 },
  { code: 'YT', name: 'Mayotte', dialCode: '262', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'MX', name: 'Mexico', dialCode: '52', nationalPrefix: null, minLength: 10, maxLength: 10 },
  { code: 'FM', name: 'Micronesia', dialCode: '691', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'MD', name: 'Moldova', dialCode: '373', nationalPrefix: '0', minLength: 8, maxLength: 8 },
  { code: 'MC', name: 'Monaco', dialCode: '377', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'MN', name: 'Mongolia', dialCode: '976', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'ME', name: 'Montenegro', dialCode: '382', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'MS', name: 'Montserrat', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'MA', name: 'Morocco', dialCode: '212', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'MZ', name: 'Mozambique', dialCode: '258', nationalPrefix: null, minLength: 8, maxLength: 9 },
  { code: 'MM', name: 'Myanmar (Burma)', dialCode: '95', nationalPrefix: '0', minLength: 6, maxLength: 10 },
  { code: 'NA', name: 'Namibia', dialCode: '264', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'NR', name: 'Nauru', dialCode: '674', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'NP', name: 'Nepal', dialCode: '977', nationalPrefix: '0', minLength: 8, maxLength: 11 },
  { code: 'NL', name: 'Netherlands', dialCode: '31', nationalPrefix: '0', minLength: 5, maxLength: 11 },
  { code: 'NC', name: 'New Caledonia', dialCode: '687', nationalPrefix: null, minLength: 6, maxLength: 6 },
  { code: 'NZ', name: 'New Zealand', dialCode: '64', nationalPrefix: '0', minLength: 5, maxLength: 10 },
  { code: 'NI', name: 'Nicaragua', dialCode: '505', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'NE', name: 'Niger', dialCode: '227', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'NG', name: 'Nigeria', dialCode: '234', nationalPrefix: '0', minLength: 10, maxLength: 14 },
  { code: 'NU', name: 'Niue', dialCode: '683', nationalPrefix: null, minLength: 4, maxLength: 7 },
  { code: 'NF', name: 'Norfolk Island', dialCode: '672', nationalPrefix: null, minLength: 6, maxLength: 6 },
  { code: 'KP', name: 'North Korea', dialCode: '850', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'MK', name: 'North Macedonia', dialCode: '389', nationalPrefix: '0', minLength: 8, maxLength: 8 },
  { code: 'MP', name: 'Northern Mariana Islands', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'NO', name: 'Norway', dialCode: '47', nationalPrefix: null, minLength: 5, maxLength: 8 },
  { code: 'OM', name: 'Oman', dialCode: '968', nationalPrefix: null, minLength: 7, maxLength: 9 },
  { code: 'PK', name: 'Pakistan', dialCode: '92', nationalPrefix: '0', minLength: 8, maxLength: 12 },
  { code: 'PW', name: 'Palau', dialCode: '680', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'PS', name: 'Palestinian Territories', dialCode: '970', nationalPrefix: '0', minLength: 8, maxLength: 10 },
  { code: 'PA', name: 'Panama', dialCode: '507', nationalPrefix: null, minLength: 7, maxLength: 11 },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '675', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'PY', name: 'Paraguay', dialCode: '595', nationalPrefix: '0', minLength: 6, maxLength: 11 },
  { code: 'PE', name: 'Peru', dialCode: '51', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'PH', name: 'Philippines', dialCode: '63', nationalPrefix: '0', minLength: 6, maxLength: 13 },
  { code: 'PL', name: 'Poland', dialCode: '48', nationalPrefix: null, minLength: 6, maxLength: 10 },
  { code: 'PT', name: 'Portugal', dialCode: '351', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'PR', name: 'Puerto Rico', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'QA', name: 'Qatar', dialCode: '974', nationalPrefix: null, minLength: 7, maxLength: 11 },
  { code: 'RE', name: 'Réunion', dialCode: '262', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'RO', name: 'Romania', dialCode: '40', nationalPrefix: '0', minLength: 6, maxLength: 9 },
  { code: 'RU', name: 'Russia', dialCode: '7', nationalPrefix: '8', minLength: 10, maxLength: 14 },
  { code: 'RW', name: 'Rwanda', dialCode: '250', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'WS', name: 'Samoa', dialCode: '685', nationalPrefix: null, minLength: 5, maxLength: 10 },
  { code: 'SM', name: 'San Marino', dialCode: '378', nationalPrefix: null, minLength: 8, maxLength: 10 },
  { code: 'ST', name: 'São Tomé & Príncipe', dialCode: '239', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '966', nationalPrefix: '0', minLength: 9, maxLength: 10 },
  { code: 'SN', name: 'Senegal', dialCode: '221', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'RS', name: 'Serbia', dialCode: '381', nationalPrefix: '0', minLength: 6, maxLength: 12 },
  { code: 'SC', name: 'Seychelles', dialCode: '248', nationalPrefix: null, minLength: 7, maxLength: 7 },
  { code: 'SL', name: 'Sierra Leone', dialCode: '232', nationalPrefix: '0', minLength: 8, maxLength: 8 },
  { code: 'SG', name: 'Singapore', dialCode: '65', nationalPrefix: null, minLength: 8, maxLength: 11 },
  { code: 'SX', name: 'Sint Maarten', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'SK', name: 'Slovakia', dialCode: '421', nationalPrefix: '0', minLength: 6, maxLength: 9 },
  { code: 'SI', name: 'Slovenia', dialCode: '386', nationalPrefix: '0', minLength: 5, maxLength: 8 },
  { code: 'SB', name: 'Solomon Islands', dialCode: '677', nationalPrefix: null, minLength: 5, maxLength: 7 },
  { code: 'SO', name: 'Somalia', dialCode: '252', nationalPrefix: '0', minLength: 6, maxLength: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '27', nationalPrefix: '0', minLength: 5, maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '82', nationalPrefix: '0', minLength: 5, maxLength: 14 },
  { code: 'SS', name: 'South Sudan', dialCode: '211', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'ES', name: 'Spain', dialCode: '34', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '94', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'BL', name: 'St. Barthélemy', dialCode: '590', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'SH', name: 'St. Helena', dialCode: '290', nationalPrefix: null, minLength: 4, maxLength: 5 },
  { code: 'KN', name: 'St. Kitts & Nevis', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'LC', name: 'St. Lucia', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'MF', name: 'St. Martin', dialCode: '590', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'PM', name: 'St. Pierre & Miquelon', dialCode: '508', nationalPrefix: '0', minLength: 6, maxLength: 9 },
  { code: 'VC', name: 'St. Vincent & Grenadines', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'SD', name: 'Sudan', dialCode: '249', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'SR', name: 'Suriname', dialCode: '597', nationalPrefix: null, minLength: 6, maxLength: 7 },
  { code: 'SJ', name: 'Svalbard & Jan Mayen', dialCode: '47', nationalPrefix: null, minLength: 5, maxLength: 8 },
  { code: 'SE', name: 'Sweden', dialCode: '46', nationalPrefix: '0', minLength: 6, maxLength: 12 },
  { code: 'CH', name: 'Switzerland', dialCode: '41', nationalPrefix: '0', minLength: 9, maxLength: 12 },
  { code: 'SY', name: 'Syria', dialCode: '963', nationalPrefix: '0', minLength: 8, maxLength: 9 },
  { code: 'TW', name: 'Taiwan', dialCode: '886', nationalPrefix: '0', minLength: 7, maxLength: 11 },
  { code: 'TJ', name: 'Tajikistan', dialCode: '992', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'TZ', name: 'Tanzania', dialCode: '255', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'TH', name: 'Thailand', dialCode: '66', nationalPrefix: '0', minLength: 8, maxLength: 13 },
  { code: 'TL', name: 'Timor-Leste', dialCode: '670', nationalPrefix: null, minLength: 7, maxLength: 8 },
  { code: 'TG', name: 'Togo', dialCode: '228', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'TK', name: 'Tokelau', dialCode: '690', nationalPrefix: null, minLength: 4, maxLength: 7 },
  { code: 'TO', name: 'Tonga', dialCode: '676', nationalPrefix: null, minLength: 5, maxLength: 7 },
  { code: 'TT', name: 'Trinidad & Tobago', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'TA', name: 'Tristan da Cunha', dialCode: '290', nationalPrefix: null, minLength: 4, maxLength: 4 },
  { code: 'TN', name: 'Tunisia', dialCode: '216', nationalPrefix: null, minLength: 8, maxLength: 8 },
  { code: 'TR', name: 'Türkiye', dialCode: '90', nationalPrefix: '0', minLength: 7, maxLength: 13 },
  { code: 'TM', name: 'Turkmenistan', dialCode: '993', nationalPrefix: '8', minLength: 8, maxLength: 8 },
  { code: 'TC', name: 'Turks & Caicos Islands', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'TV', name: 'Tuvalu', dialCode: '688', nationalPrefix: null, minLength: 5, maxLength: 7 },
  { code: 'VI', name: 'U.S. Virgin Islands', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'UG', name: 'Uganda', dialCode: '256', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'UA', name: 'Ukraine', dialCode: '380', nationalPrefix: '0', minLength: 9, maxLength: 10 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '971', nationalPrefix: '0', minLength: 5, maxLength: 12 },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '1', nationalPrefix: '1', minLength: 10, maxLength: 10 },
  { code: 'UY', name: 'Uruguay', dialCode: '598', nationalPrefix: '0', minLength: 4, maxLength: 13 },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '998', nationalPrefix: null, minLength: 9, maxLength: 9 },
  { code: 'VU', name: 'Vanuatu', dialCode: '678', nationalPrefix: null, minLength: 5, maxLength: 7 },
  { code: 'VA', name: 'Vatican City', dialCode: '39', nationalPrefix: null, minLength: 6, maxLength: 12 },
  { code: 'VE', name: 'Venezuela', dialCode: '58', nationalPrefix: '0', minLength: 10, maxLength: 10 },
  { code: 'VN', name: 'Vietnam', dialCode: '84', nationalPrefix: '0', minLength: 7, maxLength: 10 },
  { code: 'WF', name: 'Wallis & Futuna', dialCode: '681', nationalPrefix: null, minLength: 6, maxLength: 9 },
  { code: 'EH', name: 'Western Sahara', dialCode: '212', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'YE', name: 'Yemen', dialCode: '967', nationalPrefix: '0', minLength: 7, maxLength: 9 },
  { code: 'ZM', name: 'Zambia', dialCode: '260', nationalPrefix: '0', minLength: 9, maxLength: 9 },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '263', nationalPrefix: '0', minLength: 7, maxLength: 10 },
]

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((country) => [country.code, country]),
)

/** Where the field opens when it has no value and no explicit default. */
export const DEFAULT_COUNTRY = 'BD'

/**
 * The country to show when a stored value's calling code is shared by several — the `+1` group, the
 * UK's `+44`, and so on. Unlike the rows above this map *is* hand-maintained: a shared calling code
 * cannot say which of its countries a number belongs to, so the field falls back to the principal
 * one until the user picks a country.
 */
export const PRIMARY_DIAL_CODES: Record<string, string> = {
  '1': 'US',
  '7': 'RU',
  '39': 'IT',
  '44': 'GB',
  '47': 'NO',
  '61': 'AU',
  '212': 'MA',
  '262': 'RE',
  '290': 'SH',
  '358': 'FI',
  '590': 'GP',
  '599': 'CW',
}

/** The national part of a value — its digits minus the country's calling code. Tolerates the
 * spaces and punctuation a stored number may carry, not just a strict E.164 string. */
export function nationalDigitsOf(value: string, country: Country): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith(country.dialCode) ? digits.slice(country.dialCode.length) : digits
}

/**
 * The country a value belongs to, or `null` when it doesn't look like a phone number. Where the
 * calling code is shared (the `+1` group), the principal country wins — unless `preferred` is one of
 * that group, which is how a field keeps the country the caller opened it on.
 */
export function countryForValue(value: string | undefined, preferred?: Country): Country | null {
  if (!value?.startsWith('+')) return null

  const digits = value.replace(/\D/g, '')
  let best: Country | null = null
  for (const country of COUNTRIES) {
    if (!digits.startsWith(country.dialCode)) continue
    if (!best || country.dialCode.length > best.dialCode.length) best = country
  }
  if (!best) return null

  const match: Country = best
  const principal = COUNTRY_BY_CODE[PRIMARY_DIAL_CODES[match.dialCode]] ?? match
  if (!preferred) return principal

  const sameDialCode = COUNTRIES.filter((country) => country.dialCode === match.dialCode)
  return sameDialCode.some((country) => country.code === preferred.code) ? preferred : principal
}
